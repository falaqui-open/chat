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

# Load the config file if it exists
CONFIG_FILE="setup-cordova-build.cfg"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
    # cat "$CONFIG_FILE"
else
    echo "${TRED}🔴 Configuration file not found. Please create a file named setup-cordova-build.cfg in the root directory of the project.${TNC}"
    echo "${TRED}👉 Check the file setup-cordova-build.cfg-template for an example.\n${TNC}"
    exit 1
fi



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

# Firebase Cloud Messaging Setup
# Info: https://github.com/chemerisuk/cordova-plugin-firebase-messaging
cordova plugin add cordova-plugin-firebase-messaging

# Copy the google-services.json file to the project
# Is required to have the google-services.json file in the app_support_files folder
# How to get Firebase configuration file: https://support.google.com/firebase/answer/7015592
#  Steps to reproduce:
#  1) Firebase Access: https://firebase.google.com/products/cloud-messaging and Enter Get Started
#  2) Open the new project and Add the Android and iOS App
#  3) Save the config file and Finish the setup.
#  4) For iOS upload the APNS authentication key and certificates
#  5) Into General register the iOS app with bundle, App Store ID and Team Id.
#     5.1) Into Cloud Messaging Menu upload the Apple APNS Key: https://developer.apple.com/account/resources/authkeys/list
#     5.2) Name: Type a name. Eg.: apnsfalaqui
#     5.3) Service: Apple Push Notifications service (APNs)
#     5.4) Result is Key ID and P8 File to be uploaded in Upload in Firebase Cloud Messaging
#     5.5) Go to Firebase portal open the Service Accounts get the service account file
#  6) The exptected file structure is:
#     app_support_files/google-services.json
#     app_support_files/GoogleService-Info.plist
#     app_support_files/...firebase-adminsdk...json
#  7) Change the parameter FIREBASE_ADMIN_SDK_FILE_NAME in the .env file to the name of the file downloaded from the Firebase portal
#      Example of file name: falaqui-firebase-adminsdk-12345.json
echo [$(date +"%I:%M:%S")] Building Messaging service...
cp $script_dir/app_support_files/google-services.json $script_dir/app_build_$3/$1/
cp $script_dir/app_support_files/GoogleService-Info.plist $script_dir/app_build_$3/$1/

# Firebase Repo Update for iOS
if [ "$3" = "ios" ]
    then
    pod repo update
fi

# Firebase Proguard Rules for Android
if [ "$3" = "android" ]
    then
    echo [$(date +"%I:%M:%S")]   Defining Proguard Custom Rules to use cordova-plugin-firebase-messaging plugin  ...

    proguardRulesFile=$script_dir/app_build_$3/$1/proguard-custom.txt
    touch $proguardRulesFile

    echo [$(date +"%I:%M:%S")]   Writing $proguardRulesFile ...

echo "

# Keep names for methods with @CordovaMethod annotation in plugin cordova-plugin-firebase-messaging
" >> $proguardRulesFile


echo "-keepclassmembers class ** { 
    @by.chemerisuk.cordova.support.CordovaMethod *; 
}
" >> $proguardRulesFile

echo "-keep public enum by.chemerisuk.cordova.support.ReflectiveCordovaPlugin\$** { 
    **[] \$VALUES; 
    public *; 
}
" >> $proguardRulesFile

cordova plugin add cordova-plugin-proguard

fi





# ************************************************************************************
# ************************* cordova-plugin-qrscanner-11 ******************************
# ************************************************************************************
# Code forked at: https://github.com/joaocostabeeders/cordova-plugin-qrscanner-11.git
# SuppressWarnings causes build warning "uses unchecked or unsafe operations" in the 
# file platforms/android/app/src/main/java/com/bitpay/cordova/qrscanner/QRScanner.java
cordova plugin add cordova-plugin-qrscanner-11
if [ "$3" = "ios" ]
  then
    echo [$(date +"%I:%M:%S")]    Applying iOS fix into cordova-plugin-qrscanner-11 ...

    originaldir=$(pwd)

    dirfix="$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/cordova-plugin-qrscanner-11/"
    
    # Replace space to backslash
    # dirfix=$(echo "$dirfix" | sed 's/ /\\ /g')

    echo [$(date +"%I:%M:%S")]    Opening dir $dirfix
    cd "$dirfix"

    qrscannerfix1fromtext="UIApplication.openSettingsURLString"
    qrscannerfix1totext="UIApplicationOpenSettingsURLString"
    sed -i "" "s/$qrscannerfix1fromtext/$qrscannerfix1totext/" QRScanner.swift

    qrscannerfix2fromtext="self.webView?.backgroundColor = UIColor.white"
    qrscannerfix2totext="self.webView?.backgroundColor = UIColor.clear"
    sed -i "" "s/$qrscannerfix2fromtext/$qrscannerfix2totext/" QRScanner.swift

    qrscannerfix3fromtext="self.webView?.backgroundColor = UIColor.white"
    qrscannerfix3totext="self.webView?.backgroundColor = UIColor.clear"
    sed -i "" "s/$qrscannerfix3fromtext/$qrscannerfix3totext/" QRScanner.swift

    qrscannerfix4fromtext="self.webView?.scrollView.backgroundColor = UIColor.white"
    qrscannerfix4totext="self.webView?.scrollView.backgroundColor = UIColor.clear"
    sed -i "" "s/$qrscannerfix4fromtext/$qrscannerfix4totext/" QRScanner.swift

    cd $originaldir
fi

if [ "$3" = "android" ]
  then
    echo [$(date +"%I:%M:%S")]    Applying Android fix into cordova-plugin-qrscanner-11 ...
    echo [$(date +"%I:%M:%S")]    *** No fix ***
fi




echo [$(date +"%I:%M:%S")] Hooks Plugins install...
npm install xml2js --save

echo [$(date +"%I:%M:%S")] Saving restore version config...
cp config.xml config.xml.restore

cd $script_dir

sh "setup-cordova-build.sh" "$1" "$2" "$3" "$4"