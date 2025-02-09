//
//  JNIAlliances
//
#include <jnialliances.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <stdlib.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <android/log.h>
#include <alliances.h>

#define LOG_TAG "MyAppTag"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

void ensureEndsWithSlash(char **path) 
{
    size_t len = strlen(*path);
    if ((*path)[len - 1] != '/') 
    {
        // Allocate a new buffer and copy the original path, adding a slash
        char *new_path = (char *)malloc(len + 2);
        if (new_path == NULL) 
        {
            fprintf(stderr, "Memory allocation failed\n");
            return;
        }
        strcpy(new_path, *path);
        new_path[len] = '/';
        new_path[len + 1] = '\0';
        *path = new_path;
    }
}

char* getParentPath(const char* filePath) 
{
    if (filePath == NULL) {
        return NULL;
    }

    // Find the last occurrence of '/' or '\' to determine the end of the parent path
    const char* lastSlash = strrchr(filePath, '/');
    if (lastSlash == NULL) {
        // No '/' found, check for '\'
        lastSlash = strrchr(filePath, '\\');
    }

    if (lastSlash == NULL) {
        // No directory separator found, return NULL or handle as needed
        return NULL;
    }

    // Calculate the length of the parent path
    size_t parentLength = lastSlash - filePath;

    // Allocate memory for the parent path string
    char* parentPath = (char*)malloc(parentLength + 1);
    if (parentPath == NULL) {
        return NULL; // Memory allocation failed
    }

    // Copy the parent path into the new string
    strncpy(parentPath, filePath, parentLength);

    parentPath[parentLength] = '\0'; // Null-terminate the string

    return parentPath;
}

const char* copyAssetToFile(JNIEnv* env, jobject assetManager, const char* assetName, const char* outputPath) 
{
    // Convert the jobject to AAssetManager
    AAssetManager* mgr = AAssetManager_fromJava(env, assetManager);
    if (mgr == NULL) {
        return NULL;
    }

    // Open the asset using the AAssetManager
    AAsset* asset = AAssetManager_open(mgr, assetName, AASSET_MODE_UNKNOWN);
    if (asset == NULL) {
        return NULL;
    }

    // Get the length of the asset
    off_t assetLength = AAsset_getLength(asset);

    // Allocate memory to read the asset
    char* buffer = (char*) malloc(assetLength);
    if (buffer == NULL) {
        AAsset_close(asset);
        return NULL;
    }

    // Read the asset into the buffer
    int bytesRead = AAsset_read(asset, buffer, assetLength);
    if (bytesRead != assetLength) {
        free(buffer);
        AAsset_close(asset);
        return NULL;
    }

    // Close the asset
    AAsset_close(asset);

    // Write the buffer to a file in external storage
    FILE* file = fopen(outputPath, "wb");
    if (file == NULL) {
        free(buffer);
        return NULL;
    }

    fwrite(buffer, 1, assetLength, file);
    fclose(file);
    free(buffer);

    return outputPath;
}

char* jni_fileExists(const char *filePath) 
{
    LOGI("Checking file existence for path: %s", filePath);
    if (access(filePath, F_OK) == 0) 
    {
        // file exists
        LOGI("File exists: %s", filePath);
        return "tRue";
    } 
    else 
    {
        // file doesn't exist
        LOGE("File does not exist: %s", filePath);
        return "fAlse";
    }
}

// Android JNI wrapper for cross-platform C implementation
JNIEXPORT jstring JNICALL Java_app_internal_AlliancesJni_getVersion(JNIEnv* env, jclass thiz)
{
    // Call the cross-platform shared C function
    // char* c_input = strdup((*env)->GetStringUTFChars(env, j_input, 0));
    char* output = c_getVersion();
    return (*env)->NewStringUTF(env, output);
}

JNIEXPORT jstring JNICALL Java_app_internal_AlliancesJni_fileExists(JNIEnv* env, jclass thiz, jstring filePath)
{
    // Call the cross-platform shared C function
    // char* c_input = strdup((*env)->GetStringUTFChars(env, j_input, 0));
    char* output = c_fileExists(filePath);
    return (*env)->NewStringUTF(env, output);
}

// JNIEXPORT jstring JNICALL Java_app_internal_AlliancesJni_transcribeAudio(JNIEnv *env, jclass cls, jobject assetManager, jstring filePath)
// {
//     const char trueValue[] = "tRue";
//     const char *nativeFilePath = (*env)->GetStringUTFChars(env, filePath, 0);
//     char *parentPath = getParentPath(nativeFilePath);
//     ensureEndsWithSlash(&parentPath);

//     LOGI("Parent Path: %s", parentPath);
//     LOGI("Starting translation of file: %s", nativeFilePath);

//     char *jniAudioFileExists = jni_fileExists(nativeFilePath);
//     LOGI("JNI File Exists: %s", jniAudioFileExists);

//     char* fileExists = c_fileExists((char*)nativeFilePath);
//     LOGI("C File Exists: %s", fileExists);

//     int fileExistsFlag = strcmp(fileExists, trueValue);

//     if(fileExistsFlag == 0)
//     {
//         LOGI("File found in path");
//     }
//     else
//     {
//         LOGI("File not found in path");
//     }

//     char* transcriptionResult = c_transcribeAudio(nativeFilePath);
//     return (*env)->NewStringUTF(env, transcriptionResult);
// }

JNIEXPORT jstring JNICALL Java_app_internal_AlliancesJni_transcribeAudio(JNIEnv *env, jclass cls, jobject assetManager, jstring filePath, jfloatArray samples, jstring whLanguage, jint whDuration)
{
    const char trueValue[] = "tRue";
    const char *nativeFilePath = (*env)->GetStringUTFChars(env, filePath, 0);

    if (nativeFilePath == NULL) {
        // Handle error: out of memory or invalid string
        return (*env)->NewStringUTF(env, "Error: Failed to get file path.");
    }

    const char *nativeWhLanguage = (*env)->GetStringUTFChars(env, whLanguage, 0);

    if (nativeWhLanguage == NULL) {
        // Handle error: out of memory or invalid string
        (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
        return (*env)->NewStringUTF(env, "Error: Failed to get file path.");
    }

    LOGI("JNI Received duration value of %d", whDuration);

    int nativeWhDuration = (int)whDuration;

    LOGI("Native casted duration value of %d", nativeWhDuration);


    jfloat *nativeSamplesArray = (*env)->GetFloatArrayElements(env, samples, NULL);
    if (nativeSamplesArray == NULL) {
        // Handle error: out of memory or invalid array
        (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
        (*env)->ReleaseStringUTFChars(env, whLanguage, nativeWhLanguage);
        return (*env)->NewStringUTF(env, "Error: Failed to get float array elements.");
    }

    LOGI("JNI C translation using lang: %s (max duration %d)", nativeWhLanguage, nativeWhDuration);

    // Cast jfloat* to float*
    float *samplesArray = (float *)nativeSamplesArray;

    // Get the length of the array
    jsize jsizeLength = (*env)->GetArrayLength(env, samples);
    size_t length = (size_t)jsizeLength;

    LOGI("JNI Received sample with length %zu", length);

    char *modelname = "ggml-base.bin";
    char *parentPath = getParentPath(nativeFilePath);
    ensureEndsWithSlash(&parentPath);

    LOGI("Parent Path: %s", parentPath);

    // Concatenate model name to path
    strcat(parentPath, modelname);

    char *outputModelPath = (char *)malloc(strlen(parentPath) + 1);
    if (outputModelPath == NULL) {
        (*env)->ReleaseFloatArrayElements(env, samples, nativeSamplesArray, 0);
        (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
        (*env)->ReleaseStringUTFChars(env, whLanguage, nativeWhLanguage);
        free(parentPath);
        return (*env)->NewStringUTF(env, "Error: Memory allocation failed.");
    }
    strcpy(outputModelPath, parentPath);
    LOGI("Model Mounted Path: %s", outputModelPath);

    char *previousModelFileExists = c_fileExists((char *)outputModelPath);
    LOGI("Previous Model File Exists: %s", previousModelFileExists);
    int previousModelFileExistsFlag = strcmp(previousModelFileExists, trueValue);

    char *modelPath;
    int modelPathAllocated = 0;
    if (previousModelFileExistsFlag != 0) {
        LOGI("Previous model not found. Copying model from asset manager to storage...");

        char *modelPathCopy = (char *)copyAssetToFile(env, assetManager, modelname, outputModelPath);
        if (modelPathCopy == NULL) {
            (*env)->ReleaseFloatArrayElements(env, samples, nativeSamplesArray, 0);
            (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
            (*env)->ReleaseStringUTFChars(env, whLanguage, nativeWhLanguage);
            free(outputModelPath);
            free(parentPath);
            return (*env)->NewStringUTF(env, "Error: Could not load model");
        }

        modelPath = modelPathCopy;
    } else {
        modelPath = (char *)malloc(strlen(outputModelPath) + 1);
        if (modelPath == NULL) {
            (*env)->ReleaseFloatArrayElements(env, samples, nativeSamplesArray, 0);
            (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
            (*env)->ReleaseStringUTFChars(env, whLanguage, nativeWhLanguage);
            free(outputModelPath);
            free(parentPath);
            return (*env)->NewStringUTF(env, "Error: Memory allocation failed.");
        }
        strcpy(modelPath, outputModelPath);
        modelPathAllocated = 1;
    }

    free(outputModelPath);

    LOGI("Transcription Model File Path: %s", modelPath);
    char *jniModelFileExists = jni_fileExists(modelPath);
    LOGI("JNI Model File Exists: %s", jniModelFileExists);

    char *modelFileExists = c_fileExists((char *)modelPath);
    LOGI("C Model File Exists: %s", modelFileExists);

    int modelFileExistsFlag = strcmp(modelFileExists, trueValue);

    if (modelFileExistsFlag == 0) {
        LOGI("Model File found in path");
    } else {
        LOGI("Model File not found in path");
    }

    LOGI("Starting transcription of file: %s", nativeFilePath);

    char *jniAudioFileExists = jni_fileExists(nativeFilePath);
    LOGI("JNI File Exists: %s", jniAudioFileExists);

    char *fileExists = c_fileExists((char *)nativeFilePath);
    LOGI("C File Exists: %s", fileExists);

    int fileExistsFlag = strcmp(fileExists, trueValue);

    if (fileExistsFlag == 0) {
        LOGI("File found in path");
    } else {
        LOGI("File not found in path");
    }

    char *transcriptionResult = c_transcribeAudio(nativeFilePath, modelPath, samplesArray, length, nativeWhLanguage, nativeWhDuration);

    LOGI("The transcription: %s", transcriptionResult);

    // Release the float array elements
    LOGI("Release the float array elements...");
    if (nativeSamplesArray != NULL) {
        (*env)->ReleaseFloatArrayElements(env, samples, nativeSamplesArray, 0);
    }

    LOGI("Release the file path char array...");
    if (nativeFilePath != NULL) {
        (*env)->ReleaseStringUTFChars(env, filePath, nativeFilePath);
    }

    LOGI("Release the language char array...");
    if (nativeWhLanguage != NULL) {
        (*env)->ReleaseStringUTFChars(env, whLanguage, nativeWhLanguage);
    }

    if (modelPathAllocated == 1) {
        free((void *)modelPath); // Free the duplicated path
    }

    return (*env)->NewStringUTF(env, transcriptionResult);
}

JNIEXPORT void JNICALL Java_app_internal_AlliancesJni_startHTTPServer(JNIEnv* env, jclass thiz, jstring publicPath, jint port)
{
    const char *nativePublicPath = (*env)->GetStringUTFChars(env, publicPath, 0);

    if (nativePublicPath == NULL) {
        // Handle error: out of memory or invalid string
        LOGE("Error: Failed to get public path.");
    }

    int nativePort = (int)port;

    cStartHTTPServer(nativePublicPath, nativePort);

    LOGI("Release the public path char array...");
    if (publicPath != NULL) {
        (*env)->ReleaseStringUTFChars(env, publicPath, nativePublicPath);
    }
}

JNIEXPORT void JNICALL Java_app_internal_AlliancesJni_stopHTTPServer(JNIEnv* env, jclass thiz)
{
    cStopHTTPServer();
}