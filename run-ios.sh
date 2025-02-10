#!/bin/sh

if [ -z "$1" ]
  then
    echo "No argument supplied (App Name)\n"
    echo './run-ios.sh falaqui\n'
    exit 1
fi

if [ ! -d "app_build_ios/$1" ]; then
    echo "The project $1 does not exist.\n"
    exit 1
fi

cd app_build_ios/$1
# export CORDOVA_PLATFORMS=ios
# cordova build ios
# Change the "Device Name" to the one you want to use
bash cdv-build-ios.sh "Device Name"
killall Simulator
cordova run ios --target="iPhone-15-Pro-Max"