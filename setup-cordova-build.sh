#!/bin/sh

###### Stop on Error #####
set -e

#Arguments
#   App Name
#   App Project Name
#   Destination Directory Path
#   Platform (android | ios | browser | electron)

TRED='\033[0;31m'
TNC='\033[0m' # No Color

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
    echo "${TRED}🔴 No argument supplied (App Name)\n${TNC}"
    exit 1
fi

if [ -z "$2" ]
    then
    echo "${TRED}🔴 Missing 2nd argument (App Project Name)\n${TNC}"
    exit 1
fi

if [ -z "$3" ]
    then
    echo "${TRED}🔴 Missing 3th argument (Platform)\n${TNC}"
    exit 1
fi

if [ -z "$4" ]
    then
    echo "${TRED}🔴 Missing 4th argument (Version)\n${TNC}"
    exit 1
fi


case "$1" in 
    *[[:space:]]*) 
        echo "${TRED}🔴 Cannot execute: First argument contains space\n${TNC}"
        exit 1
        ;; 
esac

if [ "$3" != "ios" ] && [ "$3" != "android" ] && [ "$3" != "browser" ] && [ "$3" != "electron" ] 
    then
    echo "${TRED}🔴 Invalid platform $3\n${TNC}"
    exit 1
fi


echo "Generating Cordova build: $1 ($3)\n"


version=$4

cd app_build_$3
cd $1

echo [$(date +"%I:%M:%S")] Mounting include files...
rsync -avLK $script_dir/appfiles/www/ ./www/ > /dev/null
rsync -avLK $script_dir/appfiles/hooks/ ./hooks/ > /dev/null


echo [$(date +"%I:%M:%S")] Checking rules to obfuscate...
if [ "$JSOBFUSCATOR" = true ] ; then
    tmpcurrentdir=$(pwd)
    cd $script_dir/app_build_$3/$1/www/js
    wwwjs=*.js

    for fJs in $wwwjs; do
        # Skip obfuscation for index.js
        if [[ "$fJs" = "index.js" ]]
        then
            continue
        fi

        javascript-obfuscator $fJs -o $fJs --config $script_dir/app_support_files/obfuscator-config.json
        # INLINE METHOD: javascript-obfuscator $fJs -o $fJs --compact true --identifier-names-generator hexadecimal
    done
    cd $tmpcurrentdir
fi


echo [$(date +"%I:%M:%S")] Copying FCM Google Services File ...
cp $script_dir/app_support_files/google-services.json $script_dir/app_build_$3/$1/

echo [$(date +"%I:%M:%S")] Building Messaging service
cp $script_dir/app_support_files/GoogleService-Info.plist $script_dir/app_build_$3/$1/


if [ "$3" = "android" ]
    then

    echo [$(date +"%I:%M:%S")] Building Android Network Security XML...
    networkSecurityXML=$script_dir/app_build_$3/$1/network_security_config.xml
    networkSecurityXMLContent="<?xml version=\"1.0\" encoding=\"utf-8\"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted=\"true\">
        <domain includeSubdomains=\"true\">localhost</domain>
        <domain includeSubdomains=\"true\">127.0.0.1</domain>
        <domain includeSubdomains=\"true\">$CONFIGHOSTNAME</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted=\"true\"/>
</network-security-config>"
    
    rm -rf $networkSecurityXML
    cat <<EOT >> $networkSecurityXML
$networkSecurityXMLContent
EOT

fi

echo [$(date +"%I:%M:%S")] Mounting internal HTML image files...


echo [$(date +"%I:%M:%S")] Squared images...
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 $script_dir/app_build_$3/$1/www/images/icon-logo1024.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 $script_dir/app_build_$3/$1/www/images/default-logo.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 32x32 $script_dir/app_build_$3/$1/www/images/favicon-32x32.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 152x152 $script_dir/app_build_$3/$1/www/images/apple-touch-icon-152x152.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 180x180 $script_dir/app_build_$3/$1/www/images/apple-home-icon-180x180.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 144x144 $script_dir/app_build_$3/$1/www/images/mstile-144x144.png

echo [$(date +"%I:%M:%S")] Rectangular images...
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1136x640 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1136x640.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2436x1125 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2436x1125.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1792x828 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1792x828.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 828x1792 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-828x1792.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1334x750 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1334x750.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1242x2688 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1242x2688.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2208x1242 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2208x1242.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1125x2436 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1125x2436.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1242x2208 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1242x2208.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2732x2048 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2732x2048.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2688x1242 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2688x1242.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2224x1668 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2224x1668.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 750x1334 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-750x1334.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2048x2732 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2048x2732.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2388x1668 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2388x1668.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1668x2224 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1668x2224.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 640x1136 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-640x1136.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1668x2388 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1668x2388.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2048x1536 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2048x1536.png
convert $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1536x2048 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1536x2048.png

if [ "$3" = "browser" ]
    then
        echo [$(date +"%I:%M:%S")] Specific app code used in Browser mode...
        rsync -avLK $script_dir/appfiles/browser_include/ ./www/ > /dev/null
fi


echo [$(date +"%I:%M:%S")] Mounting build file...
rm -rf script-build.json
cat <<EOT >> script-build.json
{
    "name": "$1",
    "displayName": "$2",
    "serverEndpoint": "$SERVERENDPOINT",
    "socketEndpoint": "$SOCKETENDPOINT",
    "productVersion": "$PRODUCTVERSION",
    "useInternalSplashScreen": "$USEINTERNALSPLASHSCREEN",
    "samsungGalaxyStoreBuild": "$SAMSUNGGALAXYSTOREBUILD"
}
EOT


if [ "$3" = "electron" ]
    then
        echo [$(date +"%I:%M:%S")] Electron build file...
        rm -rf build.json
cat <<EOT >> build.json
{
    "electron": {
        "mac": {
            "package": ["dmg", "tar.gz", "zip"]
        },
        "linux": {
            "package": ["tar.gz"]
        },
        "windows": {
            "package": ["msi"]
        }
    }
}
EOT
fi


echo [$(date +"%I:%M:%S")] Mounting Pug Data Object File...
pugdataobjectfilepath="$script_dir/app_build_$3/$1/www/data-object-for-pug.json"
echo [$(date +"%I:%M:%S")] Preparing Pug Data Object $pugdataobjectfilepath...
cat <<EOT >> $pugdataobjectfilepath
{
    "appName": "$1",
    "appDisplayName": "$2",
    "platform": "$3",
    "version": "$4",
    "themeColor": "$THEME_COLOR",
    "keywords": "$KEYWORDS",
    "appWebsite": "$APPWEBSITE",
    "endpoint": "$SERVERENDPOINT",
    "socketEndpoint": "$SOCKETENDPOINT",
    "productVersion": "$PRODUCTVERSION",
    "useInternalSplashScreen": "$USEINTERNALSPLASHSCREEN",
    "samsungGalaxyStoreBuild": "$SAMSUNGGALAXYSTOREBUILD",
    "google_tag_manager": "$GOOGLETAGMANAGER",
    "defaultTheme": "$DEFAULT_THEME",
}
EOT


echo [$(date +"%I:%M:%S")] Mounting html from pug files...
$script_dir/convertpug.sh "./www/"


echo [$(date +"%I:%M:%S")] Restoring Config generated by setup-cordova script to remount the build...
rm -rf config.xml
cp config.xml.restore config.xml


echo [$(date +"%I:%M:%S")] Mounting XML Attributes...