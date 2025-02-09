# Android Makefile

APP_PLATFORM := android-21
APP_ABI := armeabi-v7a arm64-v8a x86 x86_64

PATH_SEP := /

LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

# Define the prebuilt libwhisper library
include $(CLEAR_VARS)
LOCAL_MODULE := libwhisper
LOCAL_SRC_FILES := prebuilt/$(TARGET_ARCH_ABI)/libwhisper.so
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include
include $(PREBUILT_SHARED_LIBRARY)

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

LOCAL_CFLAGS += -std=c99 -Wno-implicit-int
LOCAL_CPPFLAGS := -fblocks
TARGET_PLATFORM := android-27
LOCAL_DISABLE_FATAL_LINKER_WARNINGS := true

LOCAL_SHARED_LIBRARIES := libwhisper
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

LOCAL_CPPFLAGS += -std=c++11
TARGET_PLATFORM := android-27
LOCAL_DISABLE_FATAL_LINKER_WARNINGS := true

LOCAL_SHARED_LIBRARIES += libwhisper
LOCAL_LDLIBS += -llog -landroid -lc++_shared

include $(BUILD_SHARED_LIBRARY)