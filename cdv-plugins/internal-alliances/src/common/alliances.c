//
//  alliances.c
//  Cross-platform C functionality
//

#include "alliances.h"
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "whisper.h"
#include "httpserver.h"
// #include <Python.h>

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

typedef struct {
    char chunk_id[4];
    uint32_t chunk_size;
    char format[4];
} RIFFHeader;

typedef struct {
    char chunk_id[4];
    uint32_t chunk_size;
    uint16_t audio_format;
    uint16_t num_channels;
    uint32_t sample_rate;
    uint32_t byte_rate;
    uint16_t block_align;
    uint16_t bits_per_sample;
} FMTChunk;

char* c_getVersion() 
{
    char* version = "c-1.0.0";
    return version;
}

char* c_fileExists(char *filePath) 
{
    char* result;
    if (access(filePath, F_OK) == 0) 
    {
        // file exists
        result = "tRue";
    }
    else
    {
        result = "fAlse";
    }

    return result;
}

char* c_transcribeAudio(const char *filePath, const char *modelPath, float *samples, size_t sz_sample, const char *whLanguage, const int whDuration) 
{
    LOGI("C Transcribe Audio (lang %s and max duration %d): %s - Model: %s", whLanguage, whDuration, filePath, modelPath);   
   
    if (!samples) 
    {
        LOGI("No Samples for Audio.");
        return "";
    }

    if(sz_sample == 0)
    {
        return "";
    }

    LOGI("C Received sample with length %zu", sz_sample);
    LOGI("C sample first num %f", samples[0]);
    LOGI("C sample last num %f", samples[sz_sample - 1]);

    LOGI("C Casting sample length %zu", sz_sample);

    int n_samples = (int)sz_sample;
    LOGI("C Casting length: %d", n_samples);

    LOGI("Initializing Whisper cparams...");
    struct whisper_context_params cparams = whisper_context_default_params();

    LOGI("Initializing Whisper context...");
    struct whisper_context *ctx = whisper_init_from_file_with_params(modelPath, cparams);
    
    if (!ctx) 
    {
        // fprintf(stderr, "Failed to initialize Whisper context\n");
        LOGE("Failed to initialize Whisper context");
        free(samples);
        return "";
    }

    LOGI("Creating Whisper wparams...");

    // Create default parameters for transcription
    // struct whisper_full_params wparams = {
    //     .strategy = WHISPER_SAMPLING_GREEDY,
    //     .n_threads = 4,
    //     .n_max_text_ctx = 0,
    //     .offset_ms = 0,
    //     .duration_ms = 0,
    //     .translate = false,
    //     .no_context = false,
    //     .no_timestamps = false,
    //     .single_segment = false,
    //     .print_special = false,
    //     .print_progress = false,
    //     .print_realtime = false,
    //     .print_timestamps = false,
    //     .token_timestamps = false,
    //     .thold_pt = 0.01,
    //     .thold_ptsum = 0.01,
    //     .max_len = 0,
    //     .split_on_word = false,
    //     .max_tokens = 0,
    //     .debug_mode = false,
    //     .audio_ctx = 0,
    //     .tdrz_enable = false,
    //     .suppress_regex = NULL,
    //     .initial_prompt = NULL,
    //     .prompt_tokens = NULL,
    //     .prompt_n_tokens = 0,
    //     .language = NULL,
    //     .detect_language = false,
    //     .suppress_blank = false
    // };
    struct whisper_full_params wparams = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    wparams.n_threads = 4;
    // wparams.print_realtime = true;
    // wparams.print_timestamps = true;
    wparams.no_context = true;
    // wparams.translate = false;
    // wparams.language = "pt";
    wparams.language = whLanguage;
    wparams.duration_ms = whDuration;
    
    // wparams.detect_language = true;
   
    LOGI("Running Whisper full for sample size %d ...", n_samples);
    if (whisper_full(ctx, wparams, samples, n_samples) != 0) 
    {
        // fprintf(stderr, "Failed to process audio\n");
        LOGE("Failed to process audio");
        whisper_free(ctx);
        free(samples);
        return "";
    }

    LOGI("Running Whisper full_n_segments ...");
    // Get the transcribed text
    const int n_segments = whisper_full_n_segments(ctx);
    LOGI("Whisper Segments: %d", n_segments);

    LOGI("Processing Whisper Segment text ...");
    size_t total_length = 0;
    for (int i = 0; i < n_segments; ++i) 
    {
        const char *text = whisper_full_get_segment_text(ctx, i);
        LOGI("Segment %d of %d: %s", i+1, n_segments, text);

        total_length += strlen(text) + 1; // +1 for space or null terminator
    }

    LOGI("Allocating Whisper Result ...");

    // Allocate memory for the final result
    char *result = (char*)malloc(total_length + 1); // +1 for the null terminator
    if (!result) 
    {
        // fprintf(stderr, "Memory allocation failed\n");
        LOGE("Memory allocation failed");
        whisper_free(ctx);
        free(samples);
        return "";
    }

    LOGI("Loading Whisper Result text ...");

    // Copy the transcribed text into the result buffer
    result[0] = '\0';
    for (int i = 0; i < n_segments; ++i) 
    {
        const char *text = whisper_full_get_segment_text(ctx, i);
        strcat(result, text);
        if (i < n_segments - 1) 
        {
            strcat(result, " ");
        }
    }

    LOGI("Cleaning Whisper mem ...");

    // Clean up
    whisper_free(ctx);
    // free(samples);

    LOGI("Transcription Done: %s", result);

    return result;
}

void cStartHTTPServer(const char *publicPath, int port) 
{
    LOGI("Starting Web Server...");
    startWebServer(publicPath, port);
}

void cStopHTTPServer() 
{
    LOGI("Stopping Web Server...");
    stopWebServer();
}