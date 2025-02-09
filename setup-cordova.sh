#!/bin/sh

###### Stop on Error #####
set -e

###### Project creation with Cordova #####
#Arguments
#   App Name
#   App Project Name
#   Destination Directory Path
#   Platform (android | ios | browser | electron)

script_dir=$(pwd)
CAMERA_USAGE_REASON="We need access to your camera so that we can send documents with photos or identify your profile."
PHOTO_LIBRAY_USAGE_REASON="We need access to your photo library so we can upload documents with photos or identify your profile."
CONTACT_LIST_USAGE_REASON="We need access to your device's contact list description to facilitate your interaction with creditors and beneficiaries."
MICROPHONE_USAGE_REASON="We need microphone access to record sounds."

if [ -z "$1" ]
  then
    echo "No argument supplied (App Name)\n"
    echo 'Example How to Use ./setup-cordova.sh "falaqui" "FalaQui" "ios" "1.0.0"\n'
    exit 1
fi

if [ -z "$2" ]
  then
    echo "Missing 2nd argument (App Project Name)\n"
    echo 'Example How to Use ./setup-cordova.sh "falaqui" "FalaQui" "ios" "1.0.0"\n'
    exit 1
fi

if [ -z "$3" ]
  then
    echo "Missing 3th argument (Platform)\n"
    echo 'Example How to Use ./setup-cordova.sh "falaqui" "FalaQui" "ios" "1.0.0"\n'
    exit 1
fi

if [ -z "$4" ]
  then
    echo "Missing 4th argument (Version)\n"
    echo 'Example How to Use ./setup-cordova.sh "falaqui" "FalaQui" "ios" "1.0.0"\n'
    exit 1
fi

#echo "App Code Name $1\n"
#echo "App Name $2\n"
#echo "Platform $3\n"
#echo "Version $4\n"
#echo "Script Location $script_dir"

case "$1" in 
    *[[:space:]]*) 
        echo "Cannot execute: First argument contains space" >&2
        exit 1
        ;; 
esac

if [ "$3" != "ios" ] && [ "$3" != "android" ] && [ "$3" != "browser" ] && [ "$3" != "electron" ] 
  then
    echo "Invalid platform $3"
    exit 1
fi


# Install Cordova if not installed
if which cordova >/dev/null; then
    echo "Cordova plugin identified"
else
    echo "Installing Cordova..."
    npm install -g cordova

    if [ "$3" = "ios" ]
    then
        # sudo xcode-select --install
        # sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
        npm install -g ios-deploy --unsafe-perm=true
        npm install -g ios-sim --unsafe-perm=true
    fi
fi


# Install Pug if not installed
if which pug >/dev/null; then
    echo "Pug plugin identified"
else
    echo "Installing Pug..."
    npm install -g pug-cli
fi


# Install Javascript Obfuscator if not installed
if which javascript-obfuscator >/dev/null; then
    echo "javascript-obfuscator plugin identified"
else
    echo "Installing javascript-obfuscator..."
    npm install -g javascript-obfuscator
fi


# Install vd-tool if not installed
if which vd-tool >/dev/null; then
    echo "vd-tool plugin identified"
else
    echo "Installing vd-tool..."
    npm install -g vd-tool
fi


# Install svgo if not installed
if which svgo >/dev/null; then
    echo "svgo plugin identified"
else
    echo "Installing svgo..."
    npm install -g svgo
fi


if [ "$(uname)" = "Darwin" ]; then

    # MacOS: Install XMLStarlet if not installed
    if which xmlstarlet >/dev/null; then
        echo "xmlstarlet identified"
    else
        echo "Installing xmlstarlet..."
        brew install xmlstarlet
    fi

    # MacOS: Install ImageMagick if not installed
    if which convert >/dev/null; then
        echo "imagemagick identified"
    else
        echo "Installing imagemagick..."
        brew install imagemagick
    fi

    # MacOS: Install Potrace if not installed
    if which potrace >/dev/null; then
        echo "potrace identified"
    else
        echo "Installing potrace..."
        brew install potrace
    fi

    # MacOS: Install Gradle if not installed
    if [ "$3" = "android" ]
    then
        if which gradle >/dev/null; then
            echo "gradle identified"
        else
            echo "Installing gradle..."
            brew install gradle
        fi
    fi
elif [ "$(expr substr $(uname -s) 1 5)" = "Linux" ]; then

    # Linux: Install XMLStarlet if not installed
    if which xmlstarlet >/dev/null; then
        echo "xmlstarlet identified"
    else
        echo "Installing xmlstarlet..."
        sudo apt install xmlstarlet
    fi

    # Linux: Install ImageMagick if not installed
    if which convert >/dev/null; then
        echo "imagemagick identified"
    else
        echo "Installing imagemagick..."
        sudo apt install imagemagick
    fi

    # Linux: Install Potrace if not installed
    if which potrace >/dev/null; then
        echo "potrace identified"
    else
        echo "Installing potrace..."
        sudo apt install potrace
    fi

    # Linux: Install Gradle if not installed
    if [ "$3" = "android" ]
    then
        if which gradle >/dev/null; then
            echo "gradle identified"
        else
            echo "Installing gradle..."
            sudo apt install gradle
        fi
    fi
elif [ "$(expr substr $(uname -s) 1 10)" = "MINGW32_NT" ]; then
    # Windows is not supported to run this script
    echo "Invalid OS - Windows MINGW32_NT"
    exit 1
elif [ "$(expr substr $(uname -s) 1 10)" = "MINGW64_NT" ]; then
    # Windows is not supported to run this script
    echo "Invalid OS - Windows MINGW64_NT"
    exit 1
fi

version=$4

if [ -z "$BUNDLEIDMARKET" ]
then
      export BUNDLEIDMARKETVALUE=""
else
      export BUNDLEIDMARKETVALUE=".$BUNDLEIDMARKET"
fi

# Create Cordova Project
echo "\nCreating project: [cordova create $1 com$BUNDLEIDMARKETVALUE.$1 \"$2\"] - Version $version...\n"
mkdir -p app_build_$3
cd app_build_$3
rm -rf $1

cordova create $1 com$BUNDLEIDMARKETVALUE.$1 "$2" > /dev/null

if [ ! -d "$1" ]; then
    echo "The project was not created.\n"
    exit 1
fi

cd $1

echo [$(date +"%I:%M:%S")] Platform install...

if [ "$3" = "ios" ]
  then
    cordova platform add ios
fi

if [ "$3" = "android" ]
  then
    cordova platform add android
fi

if [ "$3" = "browser" ]
  then
    cordova platform add browser
fi

if [ "$3" = "electron" ]
  then
    cordova platform add electron@latest
    # cordova platform add https://github.com/apache/cordova-electron@latest
fi


echo [$(date +"%I:%M:%S")] Internal Plugins install...

# Internal Plugin Alliances
# If you need to recompile the alliances plugin, you must first remove the plugin and then add it again. Use the following commands to compile:
#     Android Full (Whisper and Plugin Source)  : ./alliances-compile-android.sh
#     Androind Only Plugin Source               : ./alliances-compile-android-fast.sh
#     iOS                                       : ./alliances-compile-ios.sh
# Note: It is required to have NDK and SDK installed on the machine to compile the plugin.
cordova plugin add ../../cdv-plugins/internal-alliances/

# Internal Plugin Device Locale
cordova plugin add ../../cdv-plugins/internal-devicelocale/

# Internal Plugin Native Screen
cordova plugin add ../../cdv-plugins/internal-nativescreen/

# Internal Plugin Contacts X Dev
cordova plugin add ../../cdv-plugins/cordova-plugin-contacts-x-dev/

# Internal Plugin Active Contacts
if [ "$3" = "android" ]
    then
    echo [$(date +"%I:%M:%S")]   Defining Proguard Custom Rules to use internal-activecontacts plugin  ...

    proguardRulesFile=$script_dir/app_build_$3/$1/proguard-custom.txt
    touch $proguardRulesFile

    echo [$(date +"%I:%M:%S")]   Writing $proguardRulesFile ...

echo "

# These clases contain references to ActiveContacts
" >> $proguardRulesFile


echo "-keep class app.internal.ActiveContacts.** {*; }
" >> $proguardRulesFile

echo "-keep class app.internal.ActiveContacts.*
" >> $proguardRulesFile
cordova plugin add ../../cdv-plugins/internal-activecontacts/

fi


# Cordova Plugins Install

echo [$(date +"%I:%M:%S")] Plugins install...

cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-camera --variable CAMERA_USAGE_DESCRIPTION="$CAMERA_USAGE_REASON" --variable PHOTOLIBRARY_USAGE_DESCRIPTION="$PHOTO_LIBRAY_USAGE_REASON"
cordova plugin add cordova-plugin-media --variable MICROPHONE_USAGE_DESCRIPTION="$MICROPHONE_USAGE_REASON"
cordova plugin add cordova-plugin-device
cordova plugin add cordova-clipboard
cordova plugin add cordova-plugin-webviewcolor
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-inappbrowser
cordova plugin add cordova-plugin-app-version
cordova plugin add https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git

# Plugin installed to create contacts
cordova plugin add cordova-plugin-contacts

cordova plugin add cordova-plugin-contacts-phonenumbers # Used to fetch numbers when internal-activecontacts cannot do it
cordova plugin add cordova-sqlite-storage
cordova plugin add cordova-plugin-keyboard
cordova plugin add cordova-plugin-email-composer
cordova plugin add cordova.plugins.diagnostic
cordova plugin add cordova-plugin-badge
