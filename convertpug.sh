#!/bin/sh
##### Create html files from pug files#####
dir=$1
cd $dir

FILES=*.pug
for fPug in $FILES; do
    echo "Processing $fPug file..."
    filebasename=$(basename "$fPug")
    filebasenamenoextension="${filebasename%.*}"
    htmlfile=$filebasenamenoextension.html
    rm -rf $htmlfile
    
    if [ ! -f "data-object-for-pug.json" ]; then
        echo "    Building pug without Data Object File...\n"
        pug $fPug $htmlfile --pretty --doctype html
    else
        echo "    Building pug using Data Object File...\n"
        pug $fPug $htmlfile --pretty --obj data-object-for-pug.json --doctype html
    fi

    # if [[ $filebasenamenoextension = i_* ]]
    if [ ! -n "${filebasenamenoextension%%i_*}" ]
    then
        echo "    Removing include file $filebasenamenoextension.html"
        rm -rf "$filebasenamenoextension.html"
    fi

done

rm -rf data-object-for-pug.json
rm -rf $FILES

cd ..
