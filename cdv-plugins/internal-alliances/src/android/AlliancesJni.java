package app.internal;

import android.content.res.AssetManager;
import android.content.Context;
import android.util.Log;

public class AlliancesJni {
    // C-function interface
    public static native String getVersion();
    public static native String getVersionpp();
    public static native String fileExists(String filePath);
    public static native String transcribeAudio(AssetManager assetManager, String filePath, float[] samples, String whLanguage, int whDuration);
    public static native void startHTTPServer(String publicPath, int port);
    public static native void stopHTTPServer();
    // public static native int calculate(int x, int y);

    // load library
    static {

        // Get the default system library path
        // System.loadLibrary("sqlite3");
        // System.loadLibrary("ffi");
        // System.loadLibrary("crypto1.1");
        // System.loadLibrary("ssl1.1");
        // System.loadLibrary("SDL2");
        // System.loadLibrary("SDL2_image");
        // System.loadLibrary("SDL2_mixer");
        // System.loadLibrary("SDL2_ttf");
        // System.loadLibrary("main");
        // System.loadLibrary("python3.11");

        System.loadLibrary("ggml");
        System.loadLibrary("whisper");
        System.loadLibrary("jnialliances");
        System.loadLibrary("jnialliancespp");
    }

    // public static void loadPythonLibraries(Context context) 
    // {
    //     String libName = "libpython3.11.so";
    //     String libPath = context.getApplicationInfo().nativeLibraryDir + "/" + libName;


    //     Log.d("AlliancesJni", "Loading library from path: " + libPath);

    //     try {
    //         System.load(libPath);
    //         Log.d("AlliancesJni", "Library loaded from path: " + libPath);
    //     } catch (UnsatisfiedLinkError e) {
    //         Log.e("AlliancesJni", "Failed to load library: " + e.getMessage());
    //     }

    //     System.loadLibrary("sqlite3");
    //     System.loadLibrary("ffi");
    //     System.loadLibrary("crypto1.1");
    //     System.loadLibrary("ssl1.1");
    //     System.loadLibrary("SDL2");
    //     System.loadLibrary("SDL2_image");
    //     System.loadLibrary("SDL2_mixer");
    //     System.loadLibrary("SDL2_ttf");
    //     System.loadLibrary("main");      
    // }
}
