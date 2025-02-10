#!/bin/bash

export CORDOVA_PLATFORMS=ios

# Get the device identifier for the specified device name
DEVICE_NAME=$1
DEVICE_IDENTIFIER=$(xcrun xctrace list devices | grep -oE "$DEVICE_NAME \([0-9.]+\) \([A-F0-9\-]+\)" | grep -oE '\([A-F0-9\-]+\)' | tr -d '()')

# Check if the device identifier was found
if [ -z "$DEVICE_IDENTIFIER" ]; then
    echo "Error: Could not find the device identifier for '$DEVICE_NAME'."
    exit 1
fi

echo "Device Identifier for '$DEVICE_NAME' is: $DEVICE_IDENTIFIER"

# Run the Cordova build command with the specified device
cordova build ios --device --target="$DEVICE_IDENTIFIER"

# If you want to run the app directly on the device, uncomment the following line:
# cordova run ios --device --target="$DEVICE_IDENTIFIER"