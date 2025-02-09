#!/bin/sh

echo "🟡 *** Remove previous libs/obj ..."
cd src/android

ARCHS=("arm64-v8a" "armeabi-v7a" "x86" "x86_64")
# ARCHS=("arm64-v8a" "armeabi-v7a")



if [ -z "$1" ]
  then
    ONLYSOURCE="0"
else
    ONLYSOURCE=$1
fi

if [ "$ONLYSOURCE" == "0" ]
  then
    rm -rf libs/
    rm -rf obj/
    # rm -rf jni/prebuilt/
    rm -rf include/

    mkdir -p jni/prebuilt
    mkdir -p include
    cd ../..

    echo "🟡 Compiling Whisper.cpp ..."
    cd whispercpp

    for ARCH in "${ARCHS[@]}"; do
        echo "🟡 Compiling Whisper.cpp for $ARCH ..."
        rm -rf build
        mkdir -p build
        cd build

        # if [ "$ARCH" == "x86" ]; then
        #     cmake -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake -DANDROID_ABI=$ARCH -DCMAKE_SYSTEM_PROCESSOR=$ARCH -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" -DCMAKE_CXX_FLAGS="-I${PWD}/../include" ..
        # elif [ "$ARCH" == "x86_64" ]; then
        #     cmake -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake -DANDROID_ABI=$ARCH -DCMAKE_SYSTEM_PROCESSOR=$ARCH -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" -DCMAKE_CXX_FLAGS="-I${PWD}/../include" ..
        # else
        #     cmake -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake -DANDROID_ABI=$ARCH -DCMAKE_SYSTEM_PROCESSOR=$ARCH -DCMAKE_CXX_FLAGS="-I${PWD}/../include" ..
        # fi

        CXX_FLAGS="-I${PWD}/../include -I${PWD}/../ggml/include"

        if [ "$ARCH" == "x86" ] || [ "$ARCH" == "x86_64" ]; then
            cmake -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake -DANDROID_ABI=$ARCH -DCMAKE_SYSTEM_PROCESSOR=$ARCH -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" -DCMAKE_CXX_FLAGS="$CXX_FLAGS" ..
        else
            cmake -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake -DANDROID_ABI=$ARCH -DCMAKE_SYSTEM_PROCESSOR=$ARCH -DCMAKE_CXX_FLAGS="$CXX_FLAGS" ..
        fi



        if [ $? -ne 0 ]; then
            echo "🔴 CMake configuration failed for $ARCH"
            cd ..
            continue
        fi

        # cmake --build . --verbose
        cmake --build .
        
        if [ $? -ne 0 ]; then
            echo "🔴 Build failed for $ARCH"
            cd ..
            continue
        fi
        
        if [ -f ./src/libwhisper.so ]; then
            mkdir -p ../../src/android/jni/prebuilt/$ARCH/
            cp ./src/libwhisper.so ../../src/android/jni/prebuilt/$ARCH/
            cp ../include/whisper.h ../../src/android/include/
            cp ../ggml/include/ggml.h ../../src/android/include/
        else
            echo "🔴 Error: libwhisper.so not found for $ARCH"
            continue
        fi

        cd ..
    done


    echo "🟡 Compiling ggml library ..."
    cd ggml/
    rm -rf ggml.pc.in

cat <<EOT >> ggml.pc.in
prefix=@CMAKE_INSTALL_PREFIX@
exec_prefix=${prefix}
includedir=${prefix}/include
libdir=${prefix}/lib

Name: ggml
Description: The GGML Tensor Library for Machine Learning
Version: 0.0.0
Cflags: -I${includedir}/ggml
Libs: -L${libdir} -lggml
EOT

    for ARCH in "${ARCHS[@]}"; do
        echo "🟡 Compiling ggml for $ARCH ..."
        rm -rf build
        mkdir -p build
        cd build

        if [ "$ARCH" == "x86" ] || [ "$ARCH" == "x86_64" ]; then
            cmake -DCMAKE_SYSTEM_NAME=Android -DCMAKE_SYSTEM_VERSION=33 -DCMAKE_ANDROID_ARCH_ABI=$ARCH -DGGML_BUILD_TESTS=OFF -DGGML_BUILD_EXAMPLES=OFF -DGGML_OPENMP=OFF -DCMAKE_ANDROID_NDK=${ANDROID_NDK} -DCMAKE_ANDROID_STL_TYPE=c++_shared -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" ..

        else
            cmake -DCMAKE_SYSTEM_NAME=Android -DCMAKE_SYSTEM_VERSION=33 -DCMAKE_ANDROID_ARCH_ABI=$ARCH -DGGML_BUILD_TESTS=OFF -DGGML_BUILD_EXAMPLES=OFF -DGGML_OPENMP=OFF -DCMAKE_ANDROID_NDK=${ANDROID_NDK} -DCMAKE_ANDROID_STL_TYPE=c++_shared ..
        fi

        if [ $? -ne 0 ]; then
            echo "🔴 CMake configuration failed for ggml $ARCH"
            cd ..
            continue
        fi

        cmake --build .

        if [ $? -ne 0 ]; then
            echo "🔴 Build failed for ggml $ARCH"
            cd ..
            continue
        fi

        if [ -f ./src/libggml.so ]; then
            mkdir -p ../../../src/android/jni/prebuilt/$ARCH/
            cp ./src/libggml.so ../../../src/android/jni/prebuilt/$ARCH/
        else
            echo "🔴 Error: libggml.so not found for $ARCH"
            continue
        fi

        cd ..
    done
    cd ..


    MODELNAME="base"
    # MODELNAME="small"
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

    echo "🟢 *** Whisper Compilation Done!"
    cd ..

else
    rm -rf libs/
    rm -rf obj/
    cd ../..
fi


cd src/android
echo "🟡 Clear build ..."
ndk-build clean
echo "🟢 Build cleared!"

echo "🟡 Copying Whisper and GGML .so files ..."
mkdir -p ./libs
for ARCH in "${ARCHS[@]}"; do
    mkdir -p ./libs/$ARCH
    cp ./jni/prebuilt/$ARCH/libwhisper.so ./libs/$ARCH/
    cp ./jni/prebuilt/$ARCH/libggml.so ./libs/$ARCH/
done

# rm -rf ./jni/prebuilt
# mkdir -p ./jni/prebuilt

# # If need to generate python .so files check workfiles/python/info.txt
# echo "🟡 Copying Python, SQLite and other required .so files for Python ..."
# mkdir -p ./libs
# mkdir -p ./obj
# for ARCH in "${ARCHS[@]}"; do
#     mkdir -p ./libs/$ARCH
#     cp ../../python/libs/$ARCH/libpython3.11.so ./libs/$ARCH/
#     cp ../../python/libs/$ARCH/libsqlite3.so ./libs/$ARCH/
#     cp ../../python/libs/$ARCH/libffi.so ./libs/$ARCH/
#     cp ../../python/libs/$ARCH/libcrypto1.1.so ./libs/$ARCH/
#     cp ../../python/libs/$ARCH/libssl1.1.so ./libs/$ARCH/
#     cp ../../python/libs/$ARCH/libmain.so ./libs/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2.so ./libs/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_image.so ./libs/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_mixer.so ./libs/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_ttf.so ./libs/$ARCH/
    

#     mkdir -p ./jni/prebuilt/$ARCH
#     cp ../../python/libs/$ARCH/libpython3.11.so ./jni/prebuilt/$ARCH/
#     cp ../../python/libs/$ARCH/libsqlite3.so ./jni/prebuilt/$ARCH/
#     cp ../../python/libs/$ARCH/libffi.so ./jni/prebuilt/$ARCH/
#     cp ../../python/libs/$ARCH/libcrypto1.1.so ./jni/prebuilt/$ARCH/
#     cp ../../python/libs/$ARCH/libssl1.1.so ./jni/prebuilt/$ARCH/
#     cp ../../python/libs/$ARCH/libmain.so ./jni/prebuilt/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2.so ./jni/prebuilt/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_image.so ./jni/prebuilt/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_mixer.so ./jni/prebuilt/$ARCH/
#     # cp ../../python/libs/$ARCH/libSDL2_ttf.so ./jni/prebuilt/$ARCH/
    

#     # mkdir -p ./obj/local/$ARCH
#     # cp ../../python/obj/local/$ARCH/libmain.so ./obj/local/$ARCH/
#     # cp -R ../../python/obj/local/$ARCH/objs ./obj/local/$ARCH/

#     # echo "🙂 Copying from libs to obj..."
#     # cp ../../python/libs/$ARCH/libpython3.11.so ./obj/local/$ARCH/
# done

# echo "🟡 Copying SDL Source code ..."
# wget https://github.com/libsdl-org/SDL/archive/refs/tags/release-2.30.5.zip
# unzip -o -q release-2.30.5.zip
# rm -rf release-2.30.5.zip
# rm -rf ../custominclude/libsdlapp
# mkdir -p ../custominclude/libsdlapp
# cp ./SDL-release-2.30.5/android-project/app/src/main/java/org/libsdl/app/* ../custominclude/libsdlapp/
# rm -rf SDL-release-2.30.5

echo "🟡 Copying header files ..."
cp -r include/ jni/include/

# read -p "Press enter to continue"
# sleep 2

echo "🟡 Building ..."
ndk-build
echo "🟢 Build completed"

echo "🟡 Copying libc++_shared.so ..."
HOST_TAG="darwin-x86_64"
cp $ANDROID_NDK/toolchains/llvm/prebuilt/$HOST_TAG/sysroot/usr/lib/aarch64-linux-android/libc++_shared.so ./libs/arm64-v8a/
cp $ANDROID_NDK/toolchains/llvm/prebuilt/$HOST_TAG/sysroot/usr/lib/arm-linux-androideabi/libc++_shared.so ./libs/armeabi-v7a/
cp $ANDROID_NDK/toolchains/llvm/prebuilt/$HOST_TAG/sysroot/usr/lib/i686-linux-android/libc++_shared.so ./libs/x86/
cp $ANDROID_NDK/toolchains/llvm/prebuilt/$HOST_TAG/sysroot/usr/lib/x86_64-linux-android/libc++_shared.so ./libs/x86_64/

echo "🟡 Finishing ..."

cd ../..

echo "🟢 *** Done!"

exit 0