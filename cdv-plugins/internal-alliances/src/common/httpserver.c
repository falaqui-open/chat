/**************************************************************************** 
* NAME:        httpserver.c                                     
* DESCRIPTION: Simple C Web Server
* AUTHOR:      Joao Costa (jjuniorc@gmail.com) 
***************************************************************************/ 

// #define _POSIX_C_SOURCE 200809L // Enable POSIX features for shm_unlink
#include "httpserver.h"

// Check for predefined macros to set our own macros
#if defined(__ANDROID__)
    #define PLATFORM_ANDROID
#elif defined(__APPLE__)
    #include <TargetConditionals.h>
    #if TARGET_OS_IOS
        #define PLATFORM_IOS
    #endif
#endif

#ifdef PLATFORM_ANDROID
#include <android/log.h>
#define LOG_TAG "AlliancesJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

#elif defined(PLATFORM_IOS)
#define LOGI(...) printf("INFO: " __VA_ARGS__)
#define LOGE(...) printf("ERROR: " __VA_ARGS__)
#endif

#define LOGID "[C Web Server]"
#define LISTENQ 10            // number of connections
#define PATH_BUFFER_SIZE 2048 // Increase buffer size to avoid truncation

int list_s = -1;              // listening socket
int server_running = 0;       // server running status
int server_port = 0;          // server port
char server_path[1024] = "";  // server public path
pthread_t server_thread;      // server thread

// Headers to send to clients
char *header200 = "HTTP/1.0 200 OK\nServer: SimpleCWebServer\nContent-Type: text/html\n\n";
char *header400 = "HTTP/1.0 400 Bad Request\nServer: SimpleCWebServer\nContent-Type: text/html\n\n";
char *header404 = "HTTP/1.0 404 Not Found\nServer: SimpleCWebServer\nContent-Type: text/html\n\n";

void *webServerLoop(void *args);
void createInitialFile(const char *path);

void startWebServer(const char *publicPath, int port) 
{
    if (server_running) 
    {
        LOGI("%s Server already running on port %d.\n", LOGID, server_port);
        return;
    }

    // Create a copy of publicPath to modify
    char pathCopy[1024];
    strncpy(pathCopy, publicPath, sizeof(pathCopy) - 1);

    // Remove 'file://' prefix if it exists
    char *path = pathCopy;
    if (strncmp(path, "file://", 7) == 0) 
    {
        path += 7; // Skip the 'file://'
    }

    // Check if directory exists
    if (access(path, F_OK) == -1) 
    {
        LOGI("%s Directory not found, creating: %s\n", LOGID, path);
        
        // Create the directory recursively
        char tempPath[1024];
        strncpy(tempPath, path, sizeof(tempPath));
        for (char *p = tempPath + 1; *p; p++) 
        {
            if (*p == '/') 
            {
                *p = '\0';
                if (mkdir(tempPath, 0777) == -1 && errno != EEXIST) 
                {
                    perror("mkdir");
                    LOGE("%s Error creating directory: %s\n", LOGID, tempPath);
                    return;
                }
                *p = '/';
            }
        }

        // Final directory creation
        if (mkdir(tempPath, 0777) == -1 && errno != EEXIST) 
        {
            perror("mkdir");
            LOGE("%s Error creating directory: %s\n", LOGID, tempPath);
            return;
        }
        
        createInitialFile(path);
    }

    strncpy(server_path, path, sizeof(server_path) - 1);
    server_port = port;

    if (pthread_create(&server_thread, NULL, webServerLoop, NULL) != 0) 
    {
        perror("pthread_create");
        LOGE("%s Error creating server thread.\n", LOGID);
        return;
    }

    server_running = 1;
    LOGI("%s Server started on port %d, serving directory: %s\n", LOGID, port, path);
}

void stopWebServer() 
{
    if (!server_running) 
    {
        LOGI("%s Server is not running.\n", LOGID);
        return;
    }

    server_running = 0;

    if (pthread_join(server_thread, NULL) != 0) 
    {
        perror("pthread_join");
        LOGE("%s Error stopping server thread.\n", LOGID);
        return;
    }

    cleanup(0); // Call cleanup function to close resources

    LOGI("%s Server stopped.\n", LOGID);
}

const char *statusWebServer() 
{
    if (server_running) 
    {
        return "Running";
    }
    else if (list_s == -1) 
    {
        return "Stopped";
    }
    else 
    {
        return "Error";
    }
}

void *webServerLoop(void *args) 
{
    int conn_s;
    struct sockaddr_in servaddr;

    // create the listening socket
    if ((list_s = socket(AF_INET, SOCK_STREAM, 0)) < 0) 
    {
        perror("socket");
        LOGE("%s Error creating listening socket.\n", LOGID);
        return NULL;
    }

    int optval = 1;
    if (setsockopt(list_s, SOL_SOCKET, SO_REUSEADDR, &optval, sizeof(optval)) < 0) 
    {
        perror("setsockopt");
        LOGE("%s Error setting SO_REUSEADDR.\n", LOGID);
        return NULL;
    }

    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
    servaddr.sin_port = htons(server_port);

    // Size of the address
    socklen_t addr_size = sizeof(servaddr);

    if (bind(list_s, (struct sockaddr *)&servaddr, addr_size) < 0) 
    {
        perror("bind");
        LOGE("%s Error calling bind()\n", LOGID);
        return NULL;
    }

    if (listen(list_s, LISTENQ) < 0) 
    {
        perror("listen");
        LOGE("%s Error calling listen()\n", LOGID);
        return NULL;
    }

    LOGI("%s Server listening on port %d.\n", LOGID, server_port);

    while (server_running) 
    {
        // conn_s = accept(list_s, NULL, NULL);
        conn_s = accept(list_s, (struct sockaddr *)&servaddr, &addr_size);

        if (conn_s < 0) 
        {
            if (errno == EINTR) 
            {
                continue;
            } 
            else 
            {
                perror("accept");
                break;
            }
        }

        char *header = getMessage(conn_s);

        if(header == NULL)
        {
            continue;
        }

        httpRequest details = parseRequest(header);
        free(header);

        LOGI("%s Sending (%d) %s.\n", LOGID, details.returncode, details.filename);

        int headersize = printHeader(conn_s, details.returncode);
        int pagesize = printFile(conn_s, details.filename);
       
        if (pagesize < 0) 
        {
            LOGE("%s Error serving file: %s\n", LOGID, details.filename);
        }
        
        int totaldata = headersize + pagesize;

        LOGI("%s Process %d served a request of %d bytes. Total bytes sent %d.\n", 
                LOGID, getpid(), totaldata, totaldata);

        close(conn_s);

        // Free the memory allocated for the filename
        if (details.filename != NULL) 
        {
            free(details.filename);
            details.filename = NULL; // Optional: set pointer to NULL to avoid accidental use
        }
    }

    close(list_s);
    list_s = -1;
    server_running = 0;
    return NULL;
}

void createInitialFile(const char *path) 
{
    char filePath[PATH_BUFFER_SIZE];

    // Create index.html
    snprintf(filePath, sizeof(filePath), "%s/index.html", path);
    FILE *file = fopen(filePath, "w");
    if (file == NULL) 
    {
        perror("fopen");
        LOGE("%s Error creating index.html at path: %s\n", LOGID, filePath);
        return;
    }

    fprintf(file, "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>Server Home</title>\n"
                  "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n"
                  "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n"
                  "<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, "
                  "minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover\">\n"
                  "<meta name=\"mobile-web-app-capable\" content=\"yes\">\n</head>\n<body>\n"
                  "<span>Server Home</span>\n</body>\n</html>");
    fclose(file);
    LOGI("%s Created initial index.html file at path: %s\n", LOGID, filePath);

    // Create 404.html
    snprintf(filePath, sizeof(filePath), "%s/404.html", path);
    file = fopen(filePath, "w");
    if (file == NULL) 
    {
        perror("fopen");
        LOGE("%s Error creating 404.html at path: %s\n", LOGID, filePath);
        return;
    }

    fprintf(file, "<html>\n<head>\n<title> 404 - Page Not Found </title>\n</head>\n"
                  "<body>\nWoops couldn't find that page\n</body>\n</html>");
    fclose(file);
    LOGI("%s Created initial 404.html file at path: %s\n", LOGID, filePath);

    // Create 400.html
    snprintf(filePath, sizeof(filePath), "%s/400.html", path);
    file = fopen(filePath, "w");
    if (file == NULL) 
    {
        perror("fopen");
        LOGE("%s Error creating 400.html at path: %s\n", LOGID, filePath);
        return;
    }

    fprintf(file, "<html>\n<head>\n<title> 400 - Bad Request </title>\n</head>\n"
                  "<body>\n400 Bad Request\n</body>\n</html>");
    fclose(file);
    LOGI("%s Created initial 400.html file at path: %s\n", LOGID, filePath);
}

char *getMessage(int fd) {
  
    // A file stream
    FILE *sstream;
    
    // Try to open the socket to the file stream and handle any failures
    if( (sstream = fdopen(fd, "r")) == NULL)
    {
        // fprintf(stderr, "%s Error opening file descriptor in getMessage()\n", LOGID);
        LOGE("%s Error opening file descriptor in getMessage()\n", LOGID);
        // exit(EXIT_FAILURE);
        return NULL;
    }
    
    // Size variable for passing to getline
    size_t size = 1;
    
    char *block;
    
    // Allocate some memory for block and check it went ok
    if( (block = malloc(sizeof(char) * size)) == NULL )
    {
        // fprintf(stderr, "%s Error allocating memory to block in getMessage\n", LOGID);
        LOGE("%s Error allocating memory to block in getMessage\n", LOGID);
        // exit(EXIT_FAILURE);
        return NULL;
    }
  
    // Set block to null    
    *block = '\0';
    
    // Allocate some memory for tmp and check it went ok
    char *tmp;
    if( (tmp = malloc(sizeof(char) * size)) == NULL )
    {
        // fprintf(stderr, "%s Error allocating memory to tmp in getMessage\n", LOGID);
        LOGE("%s Error allocating memory to tmp in getMessage\n", LOGID);
        // exit(EXIT_FAILURE);
        return NULL;
    }
    // Set tmp to null
    *tmp = '\0';
    
    // Int to keep track of what getline returns
    int end;
    // Int to help use resize block
    int oldsize = 1;
    
    // While getline is still getting data
    while( (end = getline( &tmp, &size, sstream)) > 0)
    {
        // If the line its read is a caridge return and a new line were at the end of the header so break
        if( strcmp(tmp, "\r\n") == 0)
        {
            break;
        }
        
        // Resize block
        block = realloc(block, size+oldsize);
        // Set the value of oldsize to the current size of block
        oldsize += size;
        // Append the latest line we got to block
        strcat(block, tmp);
    }
    
    // Free tmp a we no longer need it
    free(tmp);
    
    // Return the header
    return block;

}

// send a message to a socket file descripter
int sendMessage(int fd, char *msg) {
    return write(fd, msg, strlen(msg));
}

// Extracts the filename needed from a GET request
char * getFileName(char* msg)
{
    // Variable to store the requested filename
    char *file;

    // Allocate memory for the filename based on the request message
    if ((file = malloc(sizeof(char) * strlen(msg))) == NULL)
    {
        LOGE("%s Error allocating memory to file in getFileName()\n", LOGID);
        // exit(EXIT_FAILURE);
        return NULL;
    }

    LOGI("%s Request Message: %s", LOGID, msg);
    
    // Extract the filename from the HTTP GET request
    sscanf(msg, "GET %s HTTP/1.1", file);
    
    LOGI("%s Server Path in request: %s", LOGID, server_path);

    // Allocate memory for the full path, including the server path and the requested file
    size_t fullPathSize = strlen(server_path) + strlen(file) + 1; // +1 for the null terminator
    char *fullPath = (char *)malloc(fullPathSize);
    if (fullPath == NULL)
    {
        LOGE("%s Error allocating memory to fullPath in getFileName()\n", LOGID);
        free(file);
        // exit(EXIT_FAILURE);
        return NULL;
    }
    
    // Construct the full path using server_path and the requested file
    snprintf(fullPath, fullPathSize, "%s%s", server_path, file);
    
    // Free the temporary file memory as we no longer need it
    free(file);
    
    // Return the full path, e.g., /storage/emulated/0/Android/data/com.br.falaqui/files/public_html/index.html
    LOGI("%s Filename in request: %s", LOGID, fullPath);
    return fullPath;
}

// parse a HTTP request and return an object with return code and filename
httpRequest parseRequest(char *msg) {
    httpRequest ret;
    ret.returncode = 200;
    ret.filename = NULL;

    // Increase buffer size to avoid truncation
    char *filename = (char *)malloc(PATH_BUFFER_SIZE);

    if (filename == NULL) {
        LOGE("%s Error allocating memory to filename in parseRequest()\n", LOGID);
        // exit(EXIT_FAILURE);
        return ret;
    }

    LOGI("%s Request header %s\n", LOGID, msg);

    // Find out what page they want
    filename = getFileName(msg);

    if(filename == NULL)
    {
        return ret;
    }

    // Check if it's a directory traversal attack
    if (strstr(filename, "..") != NULL) 
    {
        // Return a 400 header and full path to 400.html
        snprintf(filename, PATH_BUFFER_SIZE, "%s/400.html", server_path);
        ret.returncode = 400;
        ret.filename = filename;
        return ret;
    }
    
    // Check if they asked for / and give them index.html
    if (strcmp(filename, "/") == 0 || strcmp(filename, "/index.html") == 0) 
    {
        snprintf(filename, PATH_BUFFER_SIZE, "%s/index.html", server_path);
        ret.returncode = 200;
        ret.filename = filename;
        return ret;
    }

    // Construct full path to requested file
    // LOGI("%s Filename before mount: %s", LOGID, filename);
    // snprintf(filename, PATH_BUFFER_SIZE, "%s%s", server_path, filename);
    // LOGI("%s Filename after mount: %s", LOGID, filename);

    // Check if the requested page exists
    FILE *exists = fopen(filename, "r");
    
    if (exists != NULL) 
    {
        LOGI("%s File found: %s", LOGID, filename);

        // If file exists, return 200 and the filename
        ret.returncode = 200;
        ret.filename = filename;
        fclose(exists);
    } 
    else 
    {
        LOGE("%s Could not find the file: %s", LOGID, filename);

        // If the file doesn't exist, return a 404 header and full path to 404.html
        snprintf(filename, PATH_BUFFER_SIZE, "%s/404.html", server_path);
        ret.returncode = 404;
        ret.filename = filename;
    }
    
    // Return the structure containing the details
    return ret;
}

// print a file out to a socket file descriptor
int printFile(int fd, char *filename) {
  
    /* Open the file filename and echo the contents from it to the file descriptor fd */
    
    // Attempt to open the file 
    FILE *read;
    if( (read = fopen(filename, "r")) == NULL)
    {
        // fprintf(stderr, "%s Error opening file in printFile()\n", LOGID);
        LOGE("%s Error opening file in printFile() for path: %s\n", LOGID, filename);
        // exit(EXIT_FAILURE);
        return -1; // Return an error code instead of exiting
    }
    
    // Get the size of this file for printing out later on
    int totalsize;
    struct stat st;
    stat(filename, &st);
    totalsize = st.st_size;
    
    // Variable for getline to write the size of the line its currently printing to
    size_t size = 1;
    
    // Get some space to store each line of the file in temporarily 
    char *temp;
    if(  (temp = malloc(sizeof(char) * size)) == NULL )
    {
        // fprintf(stderr, "%s Error allocating memory to temp in printFile()\n", LOGID);
        LOGE("%s Error allocating memory to temp in printFile()\n", LOGID);
        return -1; // Return an error code instead of exiting
        // exit(EXIT_FAILURE);
    }
    
    
    // Int to keep track of what getline returns
    int end;
    
    // While getline is still getting data
    while( (end = getline( &temp, &size, read)) > 0)
    {
        sendMessage(fd, temp);
    }
    
    // Final new line
    sendMessage(fd, "\n");
    
    // Free temp as we no longer need it
    free(temp);

    fclose(read);
    
    // Return how big the file we sent out was
    return totalsize;
  
}

// clean up listening socket and shared memory
void cleanup(int sig) 
{
    if (list_s != -1) 
    {
        LOGI("%s Cleaning up connections and exiting.\n", LOGID);

        // try to close the listening socket
        if (close(list_s) < 0) 
        {
            // fprintf(stderr, "%s Error calling close()\n", LOGID);
            LOGE("%s Error calling close()\n", LOGID);
            // exit(EXIT_FAILURE);
        }
    }
}

int printHeader(int fd, int returncode)
{
    // Print the header based on the return code
    switch (returncode)
    {
        case 200:
        sendMessage(fd, header200);
        return strlen(header200);
        break;
        
        case 400:
        sendMessage(fd, header400);
        return strlen(header400);
        break;
        
        case 404:
        sendMessage(fd, header404);
        return strlen(header404);
        break;
    }
}


// Increment the global count of data sent out 
int recordTotalBytes(int bytes_sent, sharedVariables *mempointer)
{
    // Lock the mutex
    pthread_mutex_lock(&(*mempointer).mutexlock);
    // Increment bytes_sent
    (*mempointer).totalbytes += bytes_sent;
    // Unlock the mutex
    pthread_mutex_unlock(&(*mempointer).mutexlock);
    // Return the new byte count
    return (*mempointer).totalbytes;
}