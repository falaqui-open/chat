/**************************************************************************** 
* NAME:        httpserver.h                                     
* DESCRIPTION: Simple C Web Server Header
* AUTHOR:      Joao Costa (jjuniorc@gmail.com) 
***************************************************************************/ 

#ifndef httpserver_h
#define httpserver_h

#include <sys/socket.h>       // socket definitions
#include <sys/types.h>        // socket types
#include <arpa/inet.h>        // inet (3) funtions
#include <unistd.h>           // misc. UNIX functions
#include <signal.h>           // signal handling
#include <stdlib.h>           // standard library
#include <stdio.h>            // input/output library
#include <string.h>           // string library
#include <errno.h>            // error number library
#include <fcntl.h>            // for O_* constants
#include <sys/mman.h>         // mmap library
#include <sys/types.h>        // various type definitions
#include <sys/stat.h>         // more constants
#include <pthread.h>          // thread library

typedef struct {
    int returncode;
    char *filename;
} httpRequest;

typedef struct {
    pthread_mutex_t mutexlock;
    int totalbytes;
} sharedVariables;

void startWebServer(const char *publicPath, int port);
void stopWebServer();
const char *statusWebServer();

char *getMessage(int fd);
int sendMessage(int fd, char *msg);
char *getFileName(char* msg);
httpRequest parseRequest(char *msg);
int printFile(int fd, char *filename);
void cleanup(int sig);
int printHeader(int fd, int returncode);
int recordTotalBytes(int bytes_sent, sharedVariables *mempointer);

#endif /* httpserver_h */