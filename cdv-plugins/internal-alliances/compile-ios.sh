#!/bin/sh

cd whispercpp

MODELNAME="base"
echo "🟡 Downloading model $MODELNAME ..."
# tiny	75 MiB
# tiny.en	75 MiB
# base	142 MiB
# base.en	142 MiB
# small	466 MiB
# small.en	466 MiB
# small.en-tdrz	465 MiB
# medium	1.5 GiB
# medium.en	1.5 GiB
# large-v1	2.9 GiB
# large-v2	2.9 GiB
# large-v2-q5_0	1.1 GiB
# large-v3	2.9 GiB
# large-v3-q5_0	1.1 GiB

./models/download-ggml-model.sh $MODELNAME

if [ -f ./models/ggml-$MODELNAME.bin ]; then
    # mv ./models/ggml-$MODELNAME.bin ../src/custominclude/
    cp ./models/ggml-$MODELNAME.bin ../src/custominclude/
else
    echo "🔴 Error: ./models/ggml-$MODELNAME.bin not found"
    exit 1
fi

echo "🟢 *** Whisper Model Done!"
cd ..

exit 0