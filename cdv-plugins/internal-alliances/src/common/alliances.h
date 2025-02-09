//
//  alliances.h
//  Cross-platform C functionality
//

#ifndef alliances_h
#define alliances_h

#include <stdio.h>

char* c_getVersion();
char* c_fileExists(char *filePath);
char* c_transcribeAudio(const char *filePath, const char *modelPath, float *samples, size_t sz_sample, const char *whLanguage, const int whDuration);
void cStartHTTPServer(const char *publicPath, int port);
void cStopHTTPServer();

#endif /* alliances_h */