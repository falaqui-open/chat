#!/bin/bash

# Generate 32 random characters for token secret
if [[ "$OSTYPE" == "darwin"* ]]; then
    # MacOS
    token_secret=$(LC_CTYPE=C tr -dc A-Za-z0-9 </dev/urandom | head -c 16)
else
    # Linux
    token_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16)
fi

echo $token_secret