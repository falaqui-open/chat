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
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 $script_dir/app_build_$3/$1/www/images/icon-logo1024.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 $script_dir/app_build_$3/$1/www/images/default-logo.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 32x32 $script_dir/app_build_$3/$1/www/images/favicon-32x32.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 152x152 $script_dir/app_build_$3/$1/www/images/apple-touch-icon-152x152.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 180x180 $script_dir/app_build_$3/$1/www/images/apple-home-icon-180x180.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 144x144 $script_dir/app_build_$3/$1/www/images/mstile-144x144.png

echo [$(date +"%I:%M:%S")] Rectangular images...
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1136x640 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1136x640.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2436x1125 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2436x1125.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1792x828 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1792x828.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 828x1792 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-828x1792.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1334x750 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1334x750.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1242x2688 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1242x2688.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2208x1242 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2208x1242.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1125x2436 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1125x2436.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1242x2208 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1242x2208.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2732x2048 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2732x2048.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2688x1242 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2688x1242.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2224x1668 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2224x1668.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 750x1334 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-750x1334.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2048x2732 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2048x2732.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2388x1668 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2388x1668.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1668x2224 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1668x2224.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 640x1136 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-640x1136.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1668x2388 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1668x2388.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 2048x1536 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-2048x1536.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -gravity center -extent 1536x2048 $script_dir/app_build_$3/$1/www/images/apple-icon-splash-1536x2048.png

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



###### iOS Attributes #####
if [ "$3" = "ios" ]
    then

    echo "📝 [config.xml] Setting ios XML Base ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="ios"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Access Origin ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'access origin="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'access origin="http://localhost:*/*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'access origin="http://127.0.0.1:*/*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'access origin="'"$SERVERENDPOINT"'*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Navigation ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="http://localhost"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="http://127.0.0.1"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="'"$SERVERENDPOINT"'"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Navigation for localhost 8080 ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="https://*/*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Navigation for 127 8080 ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="http://*/*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Intent ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-intent href="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Back Forward Navigation Gestures ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="AllowBackForwardNavigationGestures" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Allow Inline Media Playback ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="AllowInlineMediaPlayback" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Media Playback Requires User Action to false ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="MediaPlaybackRequiresUserAction" value="false"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios Statusbar Color ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="StatusBarBackgroundColor" value="4654A3"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios File Storage Location ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="iosPersistentFileLocation" value="Library"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    #echo "📝 [config.xml] Setting android-minSdkVersion ..."
    #xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="android-minSdkVersion" value="33"' -v "" config.xml > config2.xml
    #cp config2.xml config.xml

    #echo "📝 [config.xml] Setting android-targetSdkVersion ..."
    #xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="android-targetSdkVersion" value="33"' -v "" config.xml > config2.xml
    #cp config2.xml config.xml

    echo "📝 [config.xml] Setting ios assets..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="57" platform="ios" src="res/icon/ios/icon.png" width="57"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="114" platform="ios" src="res/icon/ios/icon@2x.png" width="114"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="60" platform="ios" src="res/icon/ios/icon-60.png" width="60"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="120" platform="ios" src="res/icon/ios/icon-60@2x.png" width="120"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="180" platform="ios" src="res/icon/ios/icon-60@3x.png" width="180"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="72" platform="ios" src="res/icon/ios/icon-72.png" width="72"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="144" platform="ios" src="res/icon/ios/icon-72@2x.png" width="144"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="76" platform="ios" src="res/icon/ios/icon-76.png" width="76"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="152" platform="ios" src="res/icon/ios/icon-76@2x.png" width="152"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="167" platform="ios" src="res/icon/ios/icon-83.5@2x.png" width="167"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="167" platform="ios" src="res/icon/ios/icon-167.png" width="167"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="1024" platform="ios" src="res/icon/ios/icon-1024.png" width="1024"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="29" platform="ios" src="res/icon/ios/icon-small.png" width="29"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="40" platform="ios" src="res/icon/ios/icon-small-40.png" width="40"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="80" platform="ios" src="res/icon/ios/icon-small-40@2x.png" width="80"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="120" platform="ios" src="res/icon/ios/icon-small-40@3x.png" width="120"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="50" platform="ios" src="res/icon/ios/icon-small-50.png" width="40"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="100" platform="ios" src="res/icon/ios/icon-small-50@2x.png" width="100"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="150" platform="ios" src="res/icon/ios/icon-small-50@3x.png" width="150"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="50" platform="ios" src="res/icon/ios/icon-50.png" width="50"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="20" platform="ios" src="res/icon/ios/icon-20.png" width="20"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="48" platform="ios" src="res/icon/ios/icon-24@2x.png" width="48"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="58" platform="ios" src="res/icon/ios/icon-small@2x.png" width="58"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="87" platform="ios" src="res/icon/ios/icon-small@3x.png" width="87"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="55" platform="ios" src="res/icon/ios/icon-27.5@2x.png" width="55"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="88" platform="ios" src="res/icon/ios/icon-44@2x.png" width="88"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="172" platform="ios" src="res/icon/ios/icon-86@2x.png" width="172"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="196" platform="ios" src="res/icon/ios/icon-98@2x.png" width="196"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'icon height="216" platform="ios" src="res/icon/ios/icon-108@2x.png" width="216"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    echo "📝 [config.xml] Setting splash Default image to be used for all modes..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash src="res/screen/ios/Default@2x~universal~anyany.png"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting splash Image to use specifically for dark mode devices..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash src="res/screen/ios/Default@2x~universal~anyany~dark.png"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting splash Image to use specifically for light mode devices..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash src="res/screen/ios/Default@2x~universal~anyany~light.png"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting splash for sizes..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="114" platform="ios" src="res/screen/ios/icon@2x.png" width="114"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1334" platform="ios" src="res/screen/ios/Default-667h.png" width="750"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="2208" platform="ios" src="res/screen/ios/Default-736h.png" width="1242"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    #xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1536" platform="ios" src="res/screen/ios/Default-Landscape@2x~ipad.png" width="2048"' -v "" config.xml > config2.xml
    #cp config2.xml config.xml

    #xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="768" platform="ios" src="res/screen/ios/Default-Landscape~ipad.png" width="1024"' -v "" config.xml > config2.xml
    #cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="2048" platform="ios" src="res/screen/ios/Default-Portrait@2x~ipad.png" width="1536"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1024" platform="ios" src="res/screen/ios/Default-Portrait~ipad.png" width="768"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="960" platform="ios" src="res/screen/ios/Default@2x~iphone.png" width="640"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="480" platform="ios" src="res/screen/ios/Default~iphone.png" width="320"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="2436" platform="ios" src="res/screen/ios/Default-2436h.png" width="1125"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1125" platform="ios" src="res/screen/ios/Default-Landscape-2436h.png" width="2436"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1242" platform="ios" src="res/screen/ios/Default-Landscape-736h.png" width="2208"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1136" platform="ios" src="res/screen/ios/Default-568h@2x~iphone.png" width="640"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="768" platform="ios" src="res/screen/ios/Default-Landscape~ipad.png" width="1024"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1536" platform="ios" src="res/screen/ios/Default-Landscape@2x~ipad.png" width="2048"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1004" platform="ios" src="res/screen/ios/Default-nsb-ipad.png" width="768"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="2008" platform="ios" src="res/screen/ios/Default-nsb@2x-ipad.png" width="1536"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="748" platform="ios" src="res/screen/ios/Default-Landscape~ipad.png" width="1024"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'splash height="1496" platform="ios" src="res/screen/ios/Default-Landscape@2x~ipad.png" width="2048"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Disable Splashscreen for iOS..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="SplashScreen" value="none"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Auto-hide Splashscreen for iOS..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="AutoHideSplashScreen" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    # echo "📝 [config.xml] Setting splash delay..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="SplashScreenDelay" value="'"$SPLASHSCREENDELAY"'"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    echo "📝 [config.xml] Setting splash delay..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="SplashScreenDelay" value="0"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="FadeSplashScreen" value="false"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="FadeSplashScreenDuration" value="'"$FADESPLASHSCREENDURATION"'"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="FadeSplashScreenDuration" value="0"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="AllowUntrustedCerts" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="InterceptRemoteRequests" value="all"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="scheme" value="app"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="hostname" value="'"$CONFIGHOSTNAME"'"' -v "" config.xml > config2.xml
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="hostname" value="localhost"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting orientation ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="orientation" value="portrait"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    # echo "Setting extra filesystems ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml


    # echo "Setting ios C++ Language Standard ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="CLANG_CXX_LANGUAGE_STANDARD" value="gnu++20"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml


    echo "📝 [config.xml] Setting plugin info..."


    #NSCameraUsageDescription
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'edit-config target="NSCameraUsageDescription" file="*-Info.plist" mode="merge"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSCameraUsageDescription']" --type elem -n 'string' -v "$CAMERA_USAGE_REASON" config.xml > config2.xml
    cp config2.xml config.xml


    #NSMicrophoneUsageDescription
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'edit-config target="NSMicrophoneUsageDescription" file="*-Info.plist" mode="merge"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSMicrophoneUsageDescription']" --type elem -n 'string' -v "$MICROPHONE_USAGE_REASON" config.xml > config2.xml
    cp config2.xml config.xml

    

    #NSPhotoLibraryUsageDescription
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'edit-config target="NSPhotoLibraryUsageDescription" file="*-Info.plist" mode="merge"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSPhotoLibraryUsageDescription']" --type elem -n 'string' -v "$PHOTO_LIBRAY_USAGE_REASON" config.xml > config2.xml
    cp config2.xml config.xml



    #NSContactsUsageDescription
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'edit-config target="NSContactsUsageDescription" file="*-Info.plist" mode="merge"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSContactsUsageDescription']" --type elem -n 'string' -v "$CONTACT_LIST_USAGE_REASON" config.xml > config2.xml
    cp config2.xml config.xml





    #NSAppTransportSecurity
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'edit-config target="NSAppTransportSecurity" file="*-Info.plist" mode="merge"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']" --type elem -n 'dict' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'key' -v "NSAllowsArbitraryLoads" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'true' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'key' -v "NSAllowsLocalNetworking" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'true' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'key' -v "NSAllowsArbitraryLoads" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'true' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'key' -v "NSAllowsArbitraryLoadsInWebContent" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'true' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'key' -v "NSAllowsArbitraryLoadsForMedia" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:edit-config[@target='NSAppTransportSecurity']/x:dict" --type elem -n 'true' -v "" config.xml > config2.xml
    cp config2.xml config.xml





    echo "📝 [config.xml] Setting version ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --update "/x:widget[@version='1.0.0']/@version" --value "$version" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting WKWebView Engine ..."
    #WKWebViewOnly
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="WKWebViewOnly" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    #CDVWKWebViewEngine
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'feature name="CDVWKWebViewEngine"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:feature[@name='CDVWKWebViewEngine']" --type elem -n 'param name="ios-package" value="CDVWKWebViewEngine"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    #CordovaWebViewEngine
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'preference name="CordovaWebViewEngine" value="CDVWKWebViewEngine"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    #NetworkStatus - CDVConnection - Usage of cordova-plugin-network-information plugin
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'feature name="NetworkStatus"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:feature[@name='NetworkStatus']" --type elem -n 'param name="ios-package" value="CDVConnection"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    #IntentAndNavigationFilter - CDVIntentAndNavigationFilter - To load an iframe on iOS devices with Cordova
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'feature name="IntentAndNavigationFilter"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:feature[@name='IntentAndNavigationFilter']" --type elem -n 'param name="ios-package" value="CDVIntentAndNavigationFilter"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']/x:feature[@name='IntentAndNavigationFilter']" --type elem -n 'param name="onload" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    #FCM Google Service File
    echo "📝 [config.xml] Setting iOS FCM Google Service Configuration File ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'resource-file src="GoogleService-Info.plist"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    echo "📝 [config.xml] Creating Hook Call ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='ios']" --type elem -n 'hook type="before_build" src="hooks/after_build/build_version.js"' -v "" config.xml > config2.xml
    cp config2.xml config.xml
fi









# --------------------- SEPARATOR --------------------- #












###### Android Attributes #####
if [ "$3" = "android" ]
    then

    echo "📝 [config.xml] Setting Android XML Base ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="android"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android Access Origin ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'access origin="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    echo "📝 [config.xml] Setting Android Allow Navigation ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-navigation href="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android Allow Intent ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'allow-intent href="*"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    echo "📝 [config.xml] Setting Android XML Namespace ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --insert "/x:widget" --type attr -n "xmlns:android" -v "http://schemas.android.com/apk/res/android" config.xml > config2.xml
    cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android Colors Resource File ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'resource-file src="res/values/colors.xml" target="/app/src/main/res/values/colors.xml"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android Load Url Timeout Value ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="loadUrlTimeoutValue" value="700000"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android KeepRunning Value ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="KeepRunning" value="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android File Storage Location ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidPersistentFileLocation" value="Internal"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Statusbar Color ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="StatusBarBackgroundColor" value="4654A3"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting android-minSdkVersion ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="android-minSdkVersion" value="24"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting android-targetSdkVersion ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="android-targetSdkVersion" value="34"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting fullscreen ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="fullscreen" value="false"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    # echo "📝 [config.xml] Setting hostname ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="hostname" value="'"$CONFIGHOSTNAME"'"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting AndroidInsecureFileModeEnabled ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidInsecureFileModeEnabled" value="true"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting MixedContentMode (0 = Never allow, 1 = Allow in secure connections, 2 = Always allow) ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="MixedContentMode" value="2"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # Commented below: Google Play Reject when using non-responsive
    # echo "📝 [config.xml] Setting orientation ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="orientation" value="portrait"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml


    echo "📝 [config.xml] Setting version ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --update "/x:widget[@version='1.0.0']/@version" --value "$version" config.xml > config2.xml
    cp config2.xml config.xml


    # echo "📝 [config.xml] Setting Android Default icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon src="res/icon/android/icon.png"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android LDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/ldpi.png" density="ldpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android MDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/mdpi.png" density="mdpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android HDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/hdpi.png" density="hdpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android XHDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/xhdpi.png" density="xhdpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android XXHDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/xxhdpi.png" density="xxhdpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml

    # echo "📝 [config.xml] Setting Android XXXHDPI icon ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'icon foreground="res/icon/android/xxxhdpi.png" density="xxxhdpi" background="@color/cdv_splashscreen_icon_background"' -v "" config.xml > config2.xml
    # cp config2.xml config.xml




    echo "📝 [config.xml] Setting Android XML splash ..."
    # xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/screen/android/splashscreen.xml"' -v "" config.xml > config2.xml
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/icon/android/splashicon.png"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting splash delay..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="SplashScreenDelay" value="'"$SPLASHSCREENDELAY"'"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android Splash Screen Background ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidWindowSplashScreenBackground" value="'"$SPLASHBACKGROUNDCOLOR"'"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Android Splash Icon Background ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'preference name="AndroidWindowSplashScreenIconBackgroundColor" value="'"$SPLASHBACKGROUNDCOLOR"'"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    echo "📝 [config.xml] Setting Android FCM Google Service Configuration File ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'resource-file src="google-services.json" target="app/google-services.json"' -v "" config.xml > config2.xml
    cp config2.xml config.xml


    echo "📝 [config.xml] Setting Android Network Security Configuration File ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'resource-file src="network_security_config.xml" target="/app/src/main/res/xml/network_security_config.xml"' -v "" config.xml > config2.xml
    cp config2.xml config.xml



    echo "📝 [config.xml] Creating edit-config tag for Android ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Clear Text Traffic into edit-config tag for Android ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']/x:edit-config[@mode='merge']" --type elem -n 'application android:usesCleartextTraffic="true"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting Network Security into edit-config Config tag for Android ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']/x:edit-config[@mode='merge']" --type elem -n 'application android:networkSecurityConfig="@xml/network_security_config"' -v "" config.xml > config2.xml
    cp config2.xml config.xml




    echo "📝 [config.xml] Creating Hook Call ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'hook type="before_build" src="hooks/after_build/build_version.js"' -v "" config.xml > config2.xml
    cp config2.xml config.xml




    echo "📝 [config.xml] Creating Config File Tag ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']" --type elem -n 'config-file target="AndroidManifest.xml" parent="application"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Adding notification icon into config-file tag ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']/x:config-file[@target='AndroidManifest.xml']" --type elem -n 'meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_single_notification"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Adding notification color config-file tag ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='android']/x:config-file[@target='AndroidManifest.xml']" --type elem -n 'meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/ic_notification_color"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

fi









# --------------------- SEPARATOR --------------------- #











###### Browser Attributes #####
if [ "$3" = "browser" ]
    then

    echo "📝 [config.xml] Setting browser XML Base ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="browser"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting version ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --update "/x:widget[@version='1.0.0']/@version" --value "$version" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Inserting browser tag"
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="browser"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Creating Hook Call ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='browser']" --type elem -n 'hook type="before_build" src="hooks/after_build/build_version.js"' -v "" config.xml > config2.xml
    cp config2.xml config.xml
fi









# --------------------- SEPARATOR --------------------- #










###### Electron Attributes #####
if [ "$3" = "electron" ]
    then

    echo "📝 [config.xml] Setting electron XML Base ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="electron"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Setting version ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --update "/x:widget[@version='1.0.0']/@version" --value "$version" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Inserting electron tag"
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget" --type elem -n 'platform name="electron"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Creating Hook Call ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='electron']" --type elem -n 'hook type="before_build" src="hooks/after_build/build_version.js"' -v "" config.xml > config2.xml
    cp config2.xml config.xml

    echo "📝 [config.xml] Defining Electron Settings File Path ..."
    xmlstarlet ed -N x="http://www.w3.org/ns/widgets" --subnode "/x:widget/x:platform[@name='electron']" --type elem -n 'preference name="ElectronSettingsFilePath" value="res/electron/settings.json"' -v "" config.xml > config2.xml
    cp config2.xml config.xml
fi









# --------------------- SEPARATOR --------------------- #









echo [$(date +"%I:%M:%S")] Cleaning temporary config edit file...
rm -rf config2.xml

echo [$(date +"%I:%M:%S")] Copying icon and splash structure...
cp -R $script_dir/icon_and_splash/res ./

echo [$(date +"%I:%M:%S")] Building Browser and Archive icons...
iconarchivebackgroundcolor="#CF240A"
# extent: image size
# resize: only logo size without padding

magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 170x200 -flatten $script_dir/app_build_$3/$1/www/img/logo.png

mkdir -p $script_dir/app_build_$3/$1/archive
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 600x600 -gravity center -background "$iconbackgroundcolor" -extent 1024x1024 -flatten $script_dir/app_build_$3/$1/archive/appstoreicon.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 600x600 -gravity center -background "$iconbackgroundcolor" -extent 1024x500 -flatten $script_dir/app_build_$3/$1/archive/googleplayfeature.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 200x200 -gravity center -background "$iconbackgroundcolor" -extent 512x512 -flatten $script_dir/app_build_$3/$1/archive/googleplayicon.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 $script_dir/app_build_$3/$1/archive/icon-logo1024.png
magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 $script_dir/app_build_$3/$1/archive/splash-logo1024.png


if [ "$3" = "ios" ]
    then

    echo [$(date +"%I:%M:%S")] Building iOS icons...

    iconbackgroundcolor="#CF240A"

    # extent: image size
    # resize: only logo size without padding
    
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 20x20 -gravity center -background "$iconbackgroundcolor" -extent 29x29 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 15x15 -gravity center -background "$iconbackgroundcolor" -extent 20x20 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-20.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 30x30 -gravity center -background "$iconbackgroundcolor" -extent 40x40 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small-40.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 30x30 -gravity center -background "$iconbackgroundcolor" -extent 48x48 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-24@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 35x35 -gravity center -background "$iconbackgroundcolor" -extent 50x50 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small-50.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 35x35 -gravity center -background "$iconbackgroundcolor" -extent 50x50 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-50.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 40x40 -gravity center -background "$iconbackgroundcolor" -extent 55x55 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-27.5@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 40x40 -gravity center -background "$iconbackgroundcolor" -extent 57x57 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 40x40 -gravity center -background "$iconbackgroundcolor" -extent 58x58 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 45x45 -gravity center -background "$iconbackgroundcolor" -extent 60x60 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-60.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 50x50 -gravity center -background "$iconbackgroundcolor" -extent 72x72 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-72.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 50x50 -gravity center -background "$iconbackgroundcolor" -extent 76x76 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-76.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 60x60 -gravity center -background "$iconbackgroundcolor" -extent 80x80 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small-40@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 70x70 -gravity center -background "$iconbackgroundcolor" -extent 87x87 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small@3x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 70x70 -gravity center -background "$iconbackgroundcolor" -extent 88x88 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-44@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 80x80 -gravity center -background "$iconbackgroundcolor" -extent 100x100 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small-50@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 90x90 -gravity center -background "$iconbackgroundcolor" -extent 114x114 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 90x90 -gravity center -background "$iconbackgroundcolor" -extent 120x120 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-small-40@3x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 90x90 -gravity center -background "$iconbackgroundcolor" -extent 120x120 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-60@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 144x144 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-72@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 152x152 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-76@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 167x167 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-167.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 167x167 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-83.5@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 110x110 -gravity center -background "$iconbackgroundcolor" -extent 172x172 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-86@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 120x120 -gravity center -background "$iconbackgroundcolor" -extent 180x180 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-60@3x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 120x120 -gravity center -background "$iconbackgroundcolor" -extent 196x196 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-98@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 150x150 -gravity center -background "$iconbackgroundcolor" -extent 216x216 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-108@2x.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 600x600 -gravity center -background "$iconbackgroundcolor" -extent 1024x1024 -flatten $script_dir/app_build_$3/$1/res/icon/ios/icon-1024.png
fi










if [ "$3" = "android" ]
    then

    iconbackgroundcolor="transparent"
    # iconbackgroundcolor="#CF240A"

    echo [$(date +"%I:%M:%S")] Building Android icons...

    # extent: image size
    # resize: only logo size without padding

    if [ "$iconbackgroundcolor" = "transparent" ]; then
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 $script_dir/app_build_$3/$1/res/icon/android/icon.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 72x72 $script_dir/app_build_$3/$1/res/icon/android/hdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 36x36 $script_dir/app_build_$3/$1/res/icon/android/ldpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 48x48 $script_dir/app_build_$3/$1/res/icon/android/mdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 96x96 $script_dir/app_build_$3/$1/res/icon/android/xhdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 144x144 $script_dir/app_build_$3/$1/res/icon/android/xxhdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 192x192 $script_dir/app_build_$3/$1/res/icon/android/xxxhdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 600x600 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1024x1024 -flatten $script_dir/app_build_$3/$1/res/icon/android/splashicon.png
    else
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 900x900 -gravity center -background "$iconbackgroundcolor" -extent 1024x1024 -flatten $script_dir/app_build_$3/$1/res/icon/android/icon.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 50x50 -gravity center -background "$iconbackgroundcolor" -extent 72x72 -flatten $script_dir/app_build_$3/$1/res/icon/android/hdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 20x20 -gravity center -background "$iconbackgroundcolor" -extent 36x36 -flatten $script_dir/app_build_$3/$1/res/icon/android/ldpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 30x30 -gravity center -background "$iconbackgroundcolor" -extent 48x48 -flatten $script_dir/app_build_$3/$1/res/icon/android/mdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 70x70 -gravity center -background "$iconbackgroundcolor" -extent 96x96 -flatten $script_dir/app_build_$3/$1/res/icon/android/xhdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 100x100 -gravity center -background "$iconbackgroundcolor" -extent 144x144 -flatten $script_dir/app_build_$3/$1/res/icon/android/xxhdpi.png
        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 110x110 -gravity center -background "$iconbackgroundcolor" -extent 192x192 -flatten $script_dir/app_build_$3/$1/res/icon/android/xxxhdpi.png
    fi

    echo [$(date +"%I:%M:%S")] Building Android Legacy icons...
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 72x72 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 36x36 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-ldpi/ic_launcher.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 48x48 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-mdpi/ic_launcher.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 96x96 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 144x144 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 192x192 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    

    echo [$(date +"%I:%M:%S")] Building Android Adaptative icons...

    iconlauncherbackgroundcolor="#CF240A"

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 50x50 -background transparent -gravity center -extent 72x72 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-hdpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 50x50 -colorspace Gray -background transparent -gravity center -extent 72x72 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-hdpi-v26/ic_launcher_monochrome.png
    magick -size 72x72 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-hdpi-v26/ic_launcher_background.png

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 20x20 -background transparent -gravity center -extent 36x36 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-ldpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 20x20 -colorspace Gray -background transparent -gravity center -extent 36x36 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-ldpi-v26/ic_launcher_monochrome.png
    magick -size 36x36 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-ldpi-v26/ic_launcher_background.png

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 30x30 -background transparent -gravity center -extent 48x48 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-mdpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 30x30 -colorspace Gray -background transparent -gravity center -extent 48x48 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-mdpi-v26/ic_launcher_monochrome.png
    magick -size 48x48 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-mdpi-v26/ic_launcher_background.png

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 90x90 -background transparent -gravity center -extent 216x216 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xhdpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 90x90 -colorspace Gray -background transparent -gravity center -extent 216x216 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xhdpi-v26/ic_launcher_monochrome.png
    magick -size 216x216 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xhdpi-v26/ic_launcher_background.png

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 130x130 -background transparent -gravity center -extent 324x324 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxhdpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 130x130 -colorspace Gray -background transparent -gravity center -extent 324x324 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxhdpi-v26/ic_launcher_monochrome.png
    magick -size 324x324 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxhdpi-v26/ic_launcher_background.png

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 200x200 -background transparent -gravity center -extent 432x432 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxxhdpi-v26/ic_launcher_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 200x200 -colorspace Gray -background transparent -gravity center -extent 432x432 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxxhdpi-v26/ic_launcher_monochrome.png
    magick -size 432x432 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/mipmap-xxxhdpi-v26/ic_launcher_background.png







    echo [$(date +"%I:%M:%S")] Building Android Notification icons...

    iconlauncherbackgroundcolor="#CF240A"

    mkdir -p $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-anydpi-v26


    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 200x200 -background transparent -gravity center -extent 432x432 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-anydpi-v26/ic_notification_foreground.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 200x200 -colorspace Gray -background transparent -gravity center -extent 432x432 $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-anydpi-v26/ic_notification_monochrome.png
    magick -size 432x432 xc:$iconlauncherbackgroundcolor $script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-anydpi-v26/ic_notification_background.png



    iconnotificationxml=$script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-anydpi-v26/ic_notification.xml
    rm -rf $iconnotificationxml

cat <<EOT >> $iconnotificationxml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_notification_background" />
    <foreground android:drawable="@drawable/ic_notification_foreground" />
    <monochrome android:drawable="@drawable/ic_notification_monochrome" />
</adaptive-icon>
EOT

    # Drawable no-dpi notification icon (white icon against icon color parameter) - white is transparent and transparent is the icon color
    drawablenodpidir=$script_dir/app_build_$3/$1/platforms/android/app/src/main/res/drawable-nodpi
    mkdir -p $drawablenodpidir
    magick $script_dir/icon_and_splash/logo4096-notification.png -resize 1024x1024 $drawablenodpidir/ic_single_notification.png

    # Add instructions at the 3rd line (3i) into colors.xml
    echo [$(date +"%I:%M:%S")] Building Android Colors XML...
    colorsXML=$script_dir/app_build_$3/$1/platforms/android/app/src/main/res/values/colors.xml
    
    cp "$colorsXML" ./tmp-colors.xml

    # Notification icon color
    if  grep -q "ic_notification_color" "$colorsXML" ; then
        echo 'Notification icon color updating...' ; 

        xmlstarlet ed -u "/resources/color[@name='ic_notification_color']" -v "$iconlauncherbackgroundcolor" tmp-colors.xml > tmp-colors2.xml
    else
        xmlstarlet ed -s "/resources" -t elem -n "color" -v "" \
                -i "/resources/color[last()]" -t attr -n "name" -v "ic_notification_color" \
                -s "/resources/color[last()]" -t text -n "" -v "$iconlauncherbackgroundcolor" tmp-colors.xml > tmp-colors2.xml
    fi
    cp tmp-colors2.xml tmp-colors.xml
    rm -rf tmp-colors2.xml



    # Default app color (theme)
    if  grep -q "default_app_color" "$colorsXML" ; then
        echo 'Default app color (theme) updating...' ; 

        xmlstarlet ed -u "/resources/color[@name='default_app_color']" -v "$THEME_COLOR" tmp-colors.xml > tmp-colors2.xml
    else
        xmlstarlet ed -s "/resources" -t elem -n "color" -v "" \
                -i "/resources/color[last()]" -t attr -n "name" -v "default_app_color" \
                -s "/resources/color[last()]" -t text -n "" -v "$THEME_COLOR" tmp-colors.xml > tmp-colors2.xml
    fi
    cp tmp-colors2.xml tmp-colors.xml
    rm -rf tmp-colors2.xml


    rm -rf "$script_dir/app_build_$3/$1/platforms/android/app/src/main/res/values/colors.xml"
    cp ./tmp-colors.xml "$script_dir/app_build_$3/$1/platforms/android/app/src/main/res/values/colors.xml"
    rm -rf tmp-colors.xml


fi







if [ "$3" = "ios" ]
    then

    echo [$(date +"%I:%M:%S")] Building iOS splash...

    # extent: image size
    # resize: only logo size

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1125x2436 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-2436h.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 640x1136 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-568h@2x~iphone.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 750x1334 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-667h.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1242x2208 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-736h.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2436x1125 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Landscape-2436h.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2208x1242 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Landscape-736h.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2048x1536 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Landscape@2x~ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1024x768 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Landscape~ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1536x2048 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Portrait@2x~ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 768x1024 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-Portrait~ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 768x1004 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-nsb-ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1536x2008 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default-nsb@2x-ipad.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2732x2732 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~ipad~anyany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1278x2732 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~ipad~comany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 640x960 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~iphone.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1334x1334 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~iphone~anyany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 750x1334 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~iphone~comany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2732x2732 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~universal~anyany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2732x2732 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~universal~anyany~dark.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2732x2732 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@2x~universal~anyany~light.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 2208x2208 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@3x~iphone~anyany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1242x2208 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default@3x~iphone~comany.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 256x256 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 320x480 -flatten $script_dir/app_build_$3/$1/res/screen/ios/Default~iphone.png

fi







if [ "$3" = "android" ]
    then

    echo [$(date +"%I:%M:%S")] Building Android splash...

    # extent: image size
    # resize: only logo size

    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 256x256 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 480x800 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-hdpi.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 128x128 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 200x320 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-ldpi.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 256x256 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 320x480 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-mdpi.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 256x256 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 720x1280 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-xhdpi.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 960x1600 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-xxhdpi.png
    magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 512x512 -gravity center -background "$SPLASHBACKGROUNDCOLOR" -extent 1280x1920 -flatten $script_dir/app_build_$3/$1/res/screen/android/splash-port-xxxhdpi.png    

    rm -rf ./res/screen/android/splashscreen.xml

    if [ "$ANDROIDSPLASHSCREENMODE" = "xml" ]
      then
        echo [$(date +"%I:%M:%S")] Building Android Vector splash...

        magick $script_dir/icon_and_splash/logo4096-transparentbg.png -resize 1024x1024 ./res/screen/android/splash-port-logo1024.png  
        magick ./res/screen/android/splash-port-logo1024.png ./res/screen/android/splash-port-logo1024.pnm
        potrace ./res/screen/android/splash-port-logo1024.pnm --svg --fillcolor "$SPLASHICONSVGBACKGROUNDCOLOR" --color "$SPLASHICONSVGSTROKECOLOR" -o ./res/screen/android/splash-port-logo1024.svg
        
        svgo ./res/screen/android/splash-port-logo1024.svg -o ./res/screen/android/splash-port-logo1024-optimized.svg
        vd-tool -c -in ./res/screen/android/splash-port-logo1024-optimized.svg -out ./res/screen/android/
        mv ./res/screen/android/splash-port-logo1024-optimized.xml ./res/screen/android/splashscreen.xml

        rm -rf ./res/screen/android/splash-port-logo1024.png
        rm -rf ./res/screen/android/splash-port-logo1024.pnm
        rm -rf ./res/screen/android/splash-port-logo1024.svg
        rm -rf ./res/screen/android/splash-port-logo1024-optimized.svg
    else
        echo "<vector xmlns:android=\"http://schemas.android.com/apk/res/android\" android:height=\"24dp\" android:width=\"24dp\" android:viewportWidth=\"24.0\" android:viewportHeight=\"24.0\"></vector>" > ./res/screen/android/splashscreen.xml
    fi
fi








if [ "$3" = "ios" ]
  then

  echo [$(date +"%I:%M:%S")] Updating Firebase pods files - replacing DT_TOOLCHAIN_DIR to TOOLCHAIN_DIR...

  sed -i -e 's/DT_TOOLCHAIN_DIR/TOOLCHAIN_DIR/g' "$script_dir/app_build_$3/$1/platforms/ios/Pods/Target Support Files/Firebase/Firebase.debug.xcconfig"
  sed -i -e 's/DT_TOOLCHAIN_DIR/TOOLCHAIN_DIR/g' "$script_dir/app_build_$3/$1/platforms/ios/Pods/Target Support Files/Firebase/Firebase.release.xcconfig"
fi

echo [$(date +"%I:%M:%S")] Translation file copy...
cp "$script_dir/local_modules/config/apptexts.json" "$script_dir/app_build_$3/$1/www/js/"


if [ "$3" = "ios" ]
    then

    echo [$(date +"%I:%M:%S")] Adding CLANG_CXX_LANGUAGE_STANDARD to gnu++20...
    echo "\nCLANG_CXX_LANGUAGE_STANDARD = gnu++20" >> "$script_dir/app_build_$3/$1/platforms/ios/cordova/build.xcconfig"

    # Add Other C Flags and Other C++ Flags
    echo [$(date +"%I:%M:%S")] Adding Other C Flags and Other C++ Flags...
    echo "OTHER_CFLAGS = -O3 -DNDEBUG" >> "$script_dir/app_build_$3/$1/platforms/ios/cordova/build.xcconfig"
    echo "OTHER_CPLUSPLUSFLAGS = -O3 -DNDEBUG" >> "$script_dir/app_build_$3/$1/platforms/ios/cordova/build.xcconfig"
fi


if [ "$3" = "ios" ]
    then

    echo [$(date +"%I:%M:%S")] Copying GGML Metal...
    # cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-metal.metal" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"

    echo [$(date +"%I:%M:%S")] Copying GGML Files...
    # cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/CMakeLists.txt" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-blas.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp -R "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-cuda" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-cuda.cu" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-kompute.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-rpc.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp -R "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-sycl" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-sycl.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-vulkan-shaders.hpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/ggml-vulkan.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp -R "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/kompute-shaders" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/sgemm.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/sgemm.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp -R "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/src/vulkan-shaders" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"

    echo [$(date +"%I:%M:%S")] Copying GGML Include Files...
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-alloc.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-blas.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-cuda.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-kompute.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-rpc.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-sycl.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/ggml/include/ggml-vulkan.h" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"

    echo [$(date +"%I:%M:%S")] Copying Whisper Files...
    cp -R "$script_dir/cdv-plugins/internal-alliances/whispercpp/src/openvino" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/src/whisper-mel-cuda.cu" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/src/whisper-mel-cuda.hpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
  
    echo [$(date +"%I:%M:%S")] Copying Whisper Test Files...
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/tests/test-backend-ops.cpp" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
    cp "$script_dir/cdv-plugins/internal-alliances/whispercpp/tests/test-c.c" "$script_dir/app_build_$3/$1/platforms/ios/$2/Plugins/internal-alliances/"
  

    echo [$(date +"%I:%M:%S")] Update Podfile...
    podfile_path=$script_dir/app_build_$3/$1/platforms/ios/Podfile

    podfileupdatecontent="
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'GCDWebServer'
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
      end
    end
  end
end
"

    # Check if the Podfile exists
    if [ -f "$podfile_path" ]; then
        # Check if the content is already present in the Podfile
        if grep -q "post_install do |installer|" "$podfile_path"; then
            echo "Post-install hook already exists in the Podfile. Skipping append."
        else
            # Append the content to the Podfile
            echo "$podfileupdatecontent" >> "$podfile_path"
            echo "Content appended successfully to the Podfile."
        fi
    else
        echo "Podfile not found at $podfile_path."
        exit 1
    fi

    tmpcurrentdir=$(pwd)
    cd $script_dir/app_build_$3/$1/platforms/ios
    pod install
    cd $tmpcurrentdir
fi





if [ "$3" = "android" ]
    then
    echo [$(date +"%I:%M:%S")] Changing Android Gradle, adding custon repository...

    # Path to the build.gradle file
    BUILD_GRADLE_PATH="$script_dir/app_build_$3/$1/platforms/android/app/build.gradle"

    echo [$(date +"%I:%M:%S")] Adding line "main.java.srcDirs += 'src/main/jniLibs'" after main.java.srcDirs += 'src/main/kotlin'

    if [ "$(uname)" = "Darwin" ]; then
        sed -i '' '/main\.java\.srcDirs \+= '\''src\/main\/kotlin'\''/a\'$'\n''         main.java.srcDirs += '\''src/main/jniLibs'\'''$'\n''       ' "$BUILD_GRADLE_PATH"

        sed -i '' '/main\.java\.srcDirs \+= '\''src\/main\/jniLibs'\''/a\'$'\n''        main.jniLibs.srcDir '\''src/main/jniLibs'\'''$'\n''        ' "$BUILD_GRADLE_PATH"
    elif [ "$(expr substr $(uname -s) 1 5)" = "Linux" ]; then
        sed -E -i '/main\.java\.srcDirs \+= '\''src\/main\/kotlin'\''/a\        main.java.srcDirs += '\''src/main/jniLibs'\''' "$BUILD_GRADLE_PATH"
  
        sed -E -i '/main\.java\.srcDirs \+= '\''src\/main\/jniLibs'\''/a\ \ \ \ \    main.jniLibs.srcDir '\''src/main/jniLibs'\''' "$BUILD_GRADLE_PATH"
    fi
fi




echo [$(date +"%I:%M:%S")] Environment build with all files...

if [ "$3" = "ios" ]
    then

    rm -rf $script_dir/app_build_$3/$1/cdv-build-ios.sh
    cp $script_dir/app_support_files/cdv-build-ios.sh $script_dir/app_build_$3/$1/

    set +e
    # cordova build ios 2>/dev/null
    bash $script_dir/app_build_$3/$1/cdv-build-ios.sh
    set -e
fi






if [ "$3" = "android" ]
    then

    export CORDOVA_PLATFORMS=android

    set +e
    cordova build android 2>/dev/null
    set -e
fi

if [ "$3" = "browser" ]
    then

    export CORDOVA_PLATFORMS=browser

    set +e
    cordova build browser 2>/dev/null
    set -e
fi

if [ "$3" = "electron" ]
    then

    export CORDOVA_PLATFORMS=electron

    set +e
    cordova build electron --release 2>/dev/null
    set -e
fi

if [ "$CONFIGHOSTNAME" = "localhost" ]
    then

    echo "${TRED}Project is using localhost host name. Change CONFIGHOSTNAME variable before publish.\n${TNC}"
fi


if [ "$3" = "android" ]
    then

    apkfile=$script_dir/app_build_$3/$1/platforms/android/app/build/outputs/apk/debug/app-debug.apk

    if ! [ -f $apkfile ] 
        then
        echo "${TRED}APK file does not exist.\n${TNC}"
        exit 1
    else
        apkdestination=$script_dir/public/apks/app-debug.apk
        rm -rf $apkdestination
        cp $apkfile $apkdestination
        echo "APK generated into /apks/app-debug.apk"
    fi
fi


# Write into $script_dir/appfiles a file called last-build-platform.txt (overwrite mode) with the platform name
rm -rf $script_dir/appfiles/last-build-platform.txt
echo $3 > $script_dir/appfiles/last-build-platform.txt
cp $script_dir/appfiles/last-build-platform.txt $script_dir/app_build_$3/$1/


echo [$(date +"%I:%M:%S")] Project setup done!