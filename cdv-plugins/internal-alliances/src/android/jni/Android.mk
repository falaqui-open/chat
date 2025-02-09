# Android Makefile

APP_PLATFORM := android-21
APP_ABI := arm64-v8a armeabi-v7a x86 x86_64

PATH_SEP := /

LOCAL_PATH := $(call my-dir)

define assert_file_exists
$(if $(wildcard $(1)),,$(error File not found: $(1)))
endef

# # Debug output to verify paths
# $(info LOCAL_PATH: $(LOCAL_PATH))
# $(info ⏱️ Checking for libpython3.11.so at $(LOCAL_PATH)/prebuilt/$(TARGET_ARCH_ABI)/libpython3.11.so)

# # Iterate over the architectures and check if the required prebuilt library exists
# $(foreach abi,$(APP_ABI),\
#     $(call assert_file_exists, $(LOCAL_PATH)/prebuilt/$(abi)/libpython3.11.so))


include $(CLEAR_VARS)

# Define the prebuilt libwhisper library
include $(CLEAR_VARS)
LOCAL_MODULE := libwhisper
LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libwhisper.so
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include
include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libggml library
include $(CLEAR_VARS)
LOCAL_MODULE := libggml
LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libggml.so
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include
include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libpython3 library
# include $(CLEAR_VARS)
# LOCAL_MODULE := libpython3
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libpython3.11.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# # Define the prebuilt libsqlite3 library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libsqlite3
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libsqlite3.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# # Define the prebuilt libffi library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libffi
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libffi.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# # Define the prebuilt libcrypto library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libcrypto
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libcrypto1.1.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# # Define the prebuilt libssl library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libssl
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libssl1.1.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libmain library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libmain
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libmain.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libSDL2 library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libSDL2
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libSDL2.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libSDL2_image library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libSDL2_image
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libSDL2_image.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libSDL2_mixer library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libSDL2_mixer
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libSDL2_mixer.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)

# Define the prebuilt libSDL2_ttf library (Python dependency)
# include $(CLEAR_VARS)
# LOCAL_MODULE := libSDL2_ttf
# LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libSDL2_ttf.so
# LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/python3
# include $(PREBUILT_SHARED_LIBRARY)




# Traverse all the directory and subdirectory
define walk
  $(wildcard $(1)) $(foreach e, $(wildcard $(1)$(PATH_SEP)*), $(call walk, $(e)))
endef

SRC_LIST :=
INCLUDE_LIST :=

################################
# Prepare shared lib jnialliances (C)

include $(CLEAR_VARS)
LOCAL_MODULE := jnialliances

# JNI interface files
INCLUDE_LIST += $(LOCAL_PATH)
SRC_LIST += $(wildcard $(LOCAL_PATH)/*.c)

# Cross-platform common files
INCLUDE_LIST += $(LOCAL_PATH)/../../common/
ifeq ($(OS),Windows_NT)
    INCLUDE_LIST += ${shell dir $(LOCAL_PATH)\..\..\common\ /ad /b /s}
else
    INCLUDE_LIST += ${shell find $(LOCAL_PATH)/../../common/ -type d}
endif
SRC_LIST += $(filter %.c, $(call walk, $(LOCAL_PATH)/../../common))

$(info LOCAL_PATH:$(LOCAL_PATH))
$(info SRC_LIST:$(SRC_LIST))
$(info INCLUDE_LIST:$(INCLUDE_LIST))

LOCAL_C_INCLUDES := $(INCLUDE_LIST) $(LOCAL_PATH)/include
LOCAL_SRC_FILES := $(SRC_LIST:$(LOCAL_PATH)/%=%)

LOCAL_CFLAGS += -std=c99 -Wno-implicit-int -D__ANDROID__
LOCAL_CPPFLAGS := -fblocks
TARGET_PLATFORM := android-27
LOCAL_DISABLE_FATAL_LINKER_WARNINGS := true

# LOCAL_SHARED_LIBRARIES := libwhisper libggml libpython3
# LOCAL_SHARED_LIBRARIES := libpython3 libsqlite3 libffi libcrypto libssl libmain libSDL2 libSDL2_image libSDL2_mixer libSDL2_ttf
# LOCAL_SHARED_LIBRARIES := libpython3 libsqlite3 libffi libcrypto libssl libmain
# LOCAL_SHARED_LIBRARIES := libmain libpython3
# LOCAL_SHARED_LIBRARIES := libffi libsqlite3 libcrypto libssl
LOCAL_SHARED_LIBRARIES := libwhisper libggml
LOCAL_LDLIBS := -llog -landroid -lc++_shared

include $(BUILD_SHARED_LIBRARY)

################################

# Clear vars before defining the second module
include $(CLEAR_VARS)

# Prepare shared lib jnialliancespp (C++)
################################

LOCAL_MODULE := jnialliancespp

# JNI interface files
INCLUDE_LIST := $(LOCAL_PATH)
SRC_LIST := $(wildcard $(LOCAL_PATH)/*.cpp)

# Cross-platform common files
INCLUDE_LIST += $(LOCAL_PATH)/../../common/
ifeq ($(OS),Windows_NT)
    INCLUDE_LIST += ${shell dir $(LOCAL_PATH)\..\..\common\ /ad /b /s}
else
    INCLUDE_LIST += ${shell find $(LOCAL_PATH)/../../common/ -type d}
endif
SRC_LIST += $(filter %.cpp, $(call walk, $(LOCAL_PATH)/../../common))

LOCAL_C_INCLUDES := $(INCLUDE_LIST) $(LOCAL_PATH)/include
LOCAL_SRC_FILES := $(SRC_LIST:$(LOCAL_PATH)/%=%)

LOCAL_CPPFLAGS += -std=c++11 -D__ANDROID__
TARGET_PLATFORM := android-27
LOCAL_DISABLE_FATAL_LINKER_WARNINGS := true

# LOCAL_SHARED_LIBRARIES += libwhisper libggml libpython3
# LOCAL_SHARED_LIBRARIES += libpython3 libsqlite3 libffi libcrypto libssl libmain libSDL2 libSDL2_image libSDL2_mixer libSDL2_ttf
# LOCAL_SHARED_LIBRARIES += libpython3 libsqlite3 libffi libcrypto libssl libmain
# LOCAL_SHARED_LIBRARIES += libmain libpython3
# LOCAL_SHARED_LIBRARIES += libffi libsqlite3 libcrypto libssl
LOCAL_SHARED_LIBRARIES += libwhisper libggml
LOCAL_LDLIBS += -llog -landroid -lc++_shared

include $(BUILD_SHARED_LIBRARY)