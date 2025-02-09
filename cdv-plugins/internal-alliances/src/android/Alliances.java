package app.internal;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.ContentResolver;
import android.os.Build;
import android.content.res.AssetManager;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.FutureTask;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.io.FileOutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;
import java.nio.channels.FileChannel;

import com.arthenica.mobileffmpeg.FFmpeg;
import com.arthenica.mobileffmpeg.Config;

import android.util.Log;

public class Alliances extends CordovaPlugin {
    private static final String LOG_TAG = "Alliances";
    private static final int READ_EXTERNAL_STORAGE_FOR_TRANSCRIPTION_REQ_CODE = 0;
    private Context context;
    private Context activityContext;

    private String transcriptionFilePath;
    private String transcriptionWhLanguage;
    private Integer transcriptionWhDuration;
    private Boolean transcriptionIsMP3;
    private CallbackContext transcriptionCallbackContext;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) 
    {
        super.initialize(cordova, webView);
        this.context = cordova.getContext();
        this.activityContext = this.cordova.getActivity().getApplicationContext();

        Log.d(LOG_TAG, "Initializing Alliances");
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException 
    {
        if(action.equals("getVersion")) 
        {
            this.getVersion(callbackContext);
        }
        else if(action.equals("audioProcessing")) 
        {
            // Example: 
            //  filePath: file:///storage/emulated/0/Android/data/com.br.falaqui/files/audio-iIrwGfqGHlXVOe088iAWS5DpP9ltlFL7TfdXPUsGJXwtDw4OK9.mp3
            //  fullPath: /audio-7NDgrffiboIhuCtYhhC26bMtgjxw712KIy2ZyuTRnQdQAGl5OI.mp3
            //  internalURL: https://localhost/__cdvfile_files-external__/audio-iIrwGfqGHlXVOe088iAWS5DpP9ltlFL7TfdXPUsGJXwtDw4OK9.mp3
            String audioPath = args.getString(0);

            this.audioProcessing(audioPath, callbackContext);
        }
        else if(action.equals("transcribeAudio")) 
        {
            String audioPath = args.getString(0);
            String whLanguage = args.getString(1);
            Integer whDuration = args.getInt(2);
            Boolean isMP3 = args.getBoolean(3);

            this.transcriptionFilePath = audioPath;
            this.transcriptionWhLanguage = whLanguage;
            this.transcriptionWhDuration = whDuration;
            this.transcriptionIsMP3 = isMP3;
            this.transcriptionCallbackContext = callbackContext;

            this.transcribeAudio(audioPath, whLanguage, whDuration, transcriptionIsMP3, callbackContext);
        }
        else if(action.equals("wav2mp3")) 
        {
            String wavPath = args.getString(0);
            this.wav2mp3(wavPath, callbackContext);
        }
        else if(action.equals("startHTTPServer")) 
        {
            String publicPath = args.getString(0);
            Integer port = args.getInt(1);

            this.startHTTPServer(publicPath, port, callbackContext);
        }
        else if(action.equals("stopHTTPServer")) 
        {
            this.stopHTTPServer(callbackContext);
        }

        return true;
    }

    private void getVersion(CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Get Version Call");

        String version = "1.0.0";
        String nativeVersion = AlliancesJni.getVersion();
        String nativeppVersion = AlliancesJni.getVersionpp();

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("version", version);
            responsePlugin.put("native", nativeVersion);
            responsePlugin.put("nativepp", nativeppVersion);
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Get Version Done");
    }  


    private void audioProcessing(String audioPath, CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Audio Processing Call: " + audioPath);


        try 
        {
            URI audioURI = new URI(audioPath);
            File audioFile = new File(audioURI);
            boolean audioFileExists = audioFile.exists();
    
            Log.d(LOG_TAG, "Audio File Exists: " + String.valueOf(audioFileExists));

            String audioPathInSystem = audioFile.getAbsolutePath();

            if(audioFileExists == true)
            {
                String audioFileExistsNative = AlliancesJni.fileExists(audioPathInSystem);

                Log.d(LOG_TAG, "Audio File Exists Native: " + audioFileExistsNative);
            }
        } 
        catch (URISyntaxException use) 
        {
            use.printStackTrace();
        }

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("result", "OK");
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Audio Processing Done");
    }  


    private void wav2mp3(String wavPath, CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Wav2MP3 Call: " + wavPath);

        String mp3Path = "";
        try 
        {
            mp3Path = convertWavToMp3(wavPath);
        } 
        catch (IOException e) 
        {
            e.printStackTrace();
        }

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("result", mp3Path);
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Wav2MP3 Done");
    }  

    private void startHTTPServer(String publicPath, Integer port, CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Start HTTP Server Call");
        AlliancesJni.startHTTPServer(publicPath, port);

        String vResponseText = "OK";

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("responseText", vResponseText);
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Start HTTP Server Done");
    } 
    
    private void stopHTTPServer(CallbackContext callbackContext) 
    {
        Log.d(LOG_TAG, "Stop HTTP Server Call");
        AlliancesJni.stopHTTPServer();

        String vResponseText = "OK";

        JSONObject responsePlugin = new JSONObject();
        try 
        {
            responsePlugin.put("responseText", vResponseText);
        } 
        catch (JSONException e) 
        {
            e.printStackTrace();
        }

        // These lines can be reused anywhere in your app to send data to the javascript
        PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
        
        //This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing  
        result.setKeepCallback(false);

        callbackContext.sendPluginResult(result);
        //no more result , hence the context is cleared.
        callbackContext = null;

        Log.d(LOG_TAG, "Stop HTTP Server Done");
    } 

    private void transcribeAudio(String audioPath, String whLanguage, Integer whDuration, Boolean isMP3, CallbackContext callbackContext) 
    {
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                Log.d(LOG_TAG, "Audio Processing Call (lang " + whLanguage + " duration max " + whDuration + ", MP3 " + isMP3 + "): " + audioPath);
    
                String audioTranscription = "";
                int audioDurationSec = 0;
                try 
                {
                    URI audioURI = new URI(audioPath);
                    File audioFile = new File(audioURI);
                    boolean audioFileExists = audioFile.exists();
    
                    String audioPathInSystem = audioFile.getAbsolutePath();
                    String audioCanonicalPathInSystem = audioFile.getCanonicalPath();
                    String audioBasePathInSystem = audioFile.getPath();
    
                    Log.d(LOG_TAG, "Audio System Path: " + audioPathInSystem);
                    Log.d(LOG_TAG, "Audio Canonical Path: " + audioCanonicalPathInSystem);
                    Log.d(LOG_TAG, "Audio Base Path: " + audioBasePathInSystem);
    
                    if (audioFileExists) 
                    {
                        AssetManager assetManager = context.getAssets();

                        String wavPath = null;
                        File wavFile = null;
                        // String pcmPath = null;
                        float[] samples = null;
                        if(isMP3 == true)
                        {
                            try 
                            {
                                wavPath = convertMp3ToWav(audioPathInSystem);
                                // pcmPath = convertMp3ToRawPcm(audioPathInSystem);
                                // samples = readPcmFile(pcmPath, 16000, 1); // Adjust sampleRate and numChannels as needed
                                if (wavPath != null) 
                                {
                                    wavFile = new File(wavPath);
                                    samples = decodeWaveFile(wavFile);
                                }
                            } 
                            catch (IOException e) 
                            {
                                e.printStackTrace();
                            }
                        }
                        else
                        {
                            try 
                            {
                                wavPath = convertWavToPCM16(audioPathInSystem);
                                if (wavPath != null) 
                                {
                                    wavFile = new File(wavPath);
                                    samples = decodeWaveFile(wavFile);
                                }
                            } 
                            catch (IOException e) 
                            {
                                e.printStackTrace();
                            }
                        }

                        if(wavPath != null)
                        {
                            if(samples.length > 0)
                            {
                                // File wavFile = new File(wavPath);
                                boolean wavFileExists = wavFile.exists();

                                if (wavFileExists)
                                {
                                    String wavPathInSystem = wavFile.getAbsolutePath();
                                    String wavCanonicalPathInSystem = wavFile.getCanonicalPath();
                                    String wavBasePathInSystem = wavFile.getPath();
                    
                                    Log.d(LOG_TAG, "Wav System Path: " + wavPathInSystem);
                                    Log.d(LOG_TAG, "Wav Canonical Path: " + wavCanonicalPathInSystem);
                                    Log.d(LOG_TAG, "Wav Base Path: " + wavBasePathInSystem);
                                    Log.d(LOG_TAG, "Wav Sample Length: " + samples.length);
                                    Log.d(LOG_TAG, "Wav Sample First Num: " + (samples.length > 0 ? samples[0] : "Empty Array") );
                                    Log.d(LOG_TAG, "Wav Sample Last Num: " + (samples.length > 0 ? samples[samples.length - 1] : "Empty Array") );

                                    // AlliancesJni.loadPythonLibraries(activityContext);

                                    int audioDuration = getAudioDuration(wavPathInSystem);
                                    audioDurationSec = audioDuration;
                                    Log.d(LOG_TAG, "Current Audio Duration: " + audioDuration);

                                    int whDurationToProcess = whDuration;                                    
                                    if((audioDuration * 1000) < whDuration)
                                    {
                                        whDurationToProcess = audioDuration * 1000;
                                    }

                                    audioTranscription = AlliancesJni.transcribeAudio(assetManager, wavPathInSystem, samples, whLanguage, whDurationToProcess);
        
                                    Log.d(LOG_TAG, "Audio File Transcription: " + audioTranscription);

                                    Log.d(LOG_TAG, "Removing Wav File");
                                    try
                                    {
                                        boolean deleted = wavFile.delete();

                                        if(deleted == true)
                                        {
                                            Log.d(LOG_TAG, "Wav File Removed!");
                                        }
                                        else
                                        {
                                            Log.d(LOG_TAG, "Wav File NOT Removed!");
                                        }
                                    }
                                    catch (SecurityException secEx) 
                                    {
                                        Log.d(LOG_TAG, "Error (SecurityException) to remove Wav File: " + secEx);
                                    }

                                }
                            }
                        }

                    }
                } 
                catch (URISyntaxException use) 
                {
                    use.printStackTrace();
                } 
                catch (IOException ioe) 
                {
                    ioe.printStackTrace();
                }
    
                JSONObject responsePlugin = new JSONObject();
                try 
                {
                    responsePlugin.put("result", audioTranscription);
                    responsePlugin.put("audioDurationSec", audioDurationSec);
                } 
                catch (JSONException e) 
                {
                    e.printStackTrace();
                }
    
                // These lines can be reused anywhere in your app to send data to the javascript
                PluginResult result = new PluginResult(PluginResult.Status.OK, responsePlugin);
    
                // This is the important part that allows executing the callback more than once, change to false if you want the callbacks to stop firing
                result.setKeepCallback(false);
    
                callbackContext.sendPluginResult(result);
                // no more result, hence the context is cleared.
                // callbackContext = null;
    
                Log.d(LOG_TAG, "Audio Processing Done");
            }
        });
    }

    public String convertMp3ToWav(String mp3Path) throws IOException 
    {
        String wavPath = mp3Path.substring(0, mp3Path.lastIndexOf('.')) + ".wav";

        FutureTask<Boolean> task = new FutureTask<>(new Callable<Boolean>() {
            @Override
            public Boolean call() {
                // FFmpeg command to convert MP3 to WAV with the required specifications
                String[] command = {
                    "-y",                 // Overwrite output files
                    "-i", mp3Path,
                    "-ac", "1",           // Number of audio channels
                    "-ar", "16000",       // Audio sampling rate
                    "-sample_fmt", "s16", // Sample format: signed 16-bit
                    "-c:a", "pcm_s16le",  // PCM format
                    "-f", "wav",
                    wavPath
                };

                int returnCode = FFmpeg.execute(command);
                if (returnCode == Config.RETURN_CODE_SUCCESS) {
                    Log.i(LOG_TAG, "Conversion successful: " + wavPath);

                    // try {
                    //     Thread.sleep(2000); // Wait for 2 seconds
                    // } catch (InterruptedException e) {
                    //     Log.e(LOG_TAG, "Interrupted while waiting for file to be written.");
                    // }

                    return true;
                } else {
                    Log.e(LOG_TAG, "Conversion failed with return code: " + returnCode);
                    return false;
                }
            }
        });

        Executors.newSingleThreadExecutor().submit(task);

        try {
            boolean success = task.get(); // This will block until the task completes
            if (!success) {
                throw new IOException("Failed to convert MP3 to WAV");
            }
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Conversion interrupted", e);
        }

        File wavFile = new File(wavPath);
        if (!wavFile.exists()) {
            throw new IOException("Failed to convert MP3 to WAV");
        }

        return wavPath;
    }

    public String convertWavToMp3(String wavPath) throws IOException {
        String mp3Path = wavPath.substring(0, wavPath.lastIndexOf('.')) + ".mp3";
        Log.i(LOG_TAG, "Converting WAV to MP3: " + wavPath + " to " + mp3Path);
    
        FutureTask<Boolean> task = new FutureTask<>(new Callable<Boolean>() {
            @Override
            public Boolean call() {
                String[] command = {
                    "-y",
                    "-i", wavPath,
                    "-vn",
                    "-ar", "44100",
                    "-ac", "2",
                    "-b:a", "96k",
                    "-f", "mp3",
                    mp3Path
                };
    
                int returnCode = FFmpeg.execute(command);
                Log.i(LOG_TAG, "FFmpeg execute return code: " + returnCode);
                if (returnCode == Config.RETURN_CODE_SUCCESS) {
                    Log.i(LOG_TAG, "Conversion successful: " + mp3Path);
                    return true;
                } else {
                    Log.e(LOG_TAG, "Conversion failed with return code: " + returnCode);
                    return false;
                }
            }
        });
    
        Executors.newSingleThreadExecutor().submit(task);
    
        try {
            boolean success = task.get(); // This will block until the task completes
            if (!success) {
                throw new IOException("Failed to convert WAV to MP3");
            }
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Conversion interrupted", e);
        }
    
        // Verify the file exists using URI
        try {
            Log.i(LOG_TAG, "Checking MP3 file: " + mp3Path);
            URI mp3URI = new URI(mp3Path);
            File mp3File = new File(mp3URI);
            if (mp3File.exists()) {
                Log.i(LOG_TAG, "MP3 file exists: " + mp3Path);
                return mp3Path;
            } else {
                Log.e(LOG_TAG, "MP3 file not found after conversion: " + mp3Path);
                throw new IOException("Failed to convert WAV to MP3");
            }
        } catch (URISyntaxException e) {
            throw new IOException("Invalid URI for MP3 file path: " + mp3Path, e);
        }
    }

    public String convertWavToPCM16(String wavPath) throws IOException {
        String pcmWavPath = wavPath.substring(0, wavPath.lastIndexOf('.')) + "_pcm16.wav";
    
        FutureTask<Boolean> task = new FutureTask<>(new Callable<Boolean>() {
            @Override
            public Boolean call() {
                // FFmpeg command to convert WAV to WAV with PCM 16-bit format
                String[] command = {
                    "-y",                 // Overwrite output files
                    "-i", wavPath,
                    "-ac", "1",           // Number of audio channels
                    "-ar", "16000",       // Audio sampling rate
                    "-sample_fmt", "s16", // Sample format: signed 16-bit
                    "-c:a", "pcm_s16le",  // PCM format
                    "-f", "wav",
                    pcmWavPath
                };
    
                int returnCode = FFmpeg.execute(command);
                if (returnCode == Config.RETURN_CODE_SUCCESS) {
                    Log.i(LOG_TAG, "Conversion successful: " + pcmWavPath);
                    return true;
                } else {
                    Log.e(LOG_TAG, "Conversion failed with return code: " + returnCode);
                    return false;
                }
            }
        });
    
        Executors.newSingleThreadExecutor().submit(task);
    
        try {
            boolean success = task.get(); // This will block until the task completes
            if (!success) {
                throw new IOException("Failed to convert WAV to PCM 16 WAV");
            }
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Conversion interrupted", e);
        }
    
        File pcmWavFile = new File(pcmWavPath);
        if (!pcmWavFile.exists()) {
            throw new IOException("Failed to convert WAV to PCM 16 WAV");
        }
    
        return pcmWavPath;
    }


    public static float[] decodeWaveFile(File file) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (FileInputStream fis = new FileInputStream(file)) {
        byte[] buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = fis.read(buffer)) != -1) {
            baos.write(buffer, 0, bytesRead);
        }
        }
        ByteBuffer byteBuffer = ByteBuffer.wrap(baos.toByteArray());
        byteBuffer.order(ByteOrder.LITTLE_ENDIAN);

        int channel = byteBuffer.getShort(22);
        byteBuffer.position(44);

        ShortBuffer shortBuffer = byteBuffer.asShortBuffer();
        short[] shortArray = new short[shortBuffer.limit()];
        shortBuffer.get(shortArray);

        float[] output = new float[shortArray.length / channel];

        for (int index = 0; index < output.length; index++) {
        if (channel == 1) {
            output[index] = Math.max(-1f, Math.min(1f, shortArray[index] / 32767.0f));
        } else {
            output[index] = Math.max(-1f, Math.min(1f, (shortArray[2 * index] + shortArray[2 * index + 1]) / 32767.0f / 2.0f));
        }
        }
        return output;
    }

    public static void encodeWaveFile(File file, short[] data) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(file)) {
        fos.write(headerBytes(data.length * 2));

        ByteBuffer buffer = ByteBuffer.allocate(data.length * 2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.asShortBuffer().put(data);

        byte[] bytes = new byte[buffer.limit()];
        buffer.get(bytes);

        fos.write(bytes);
        }
    }

    private static byte[] headerBytes(int totalLength) {
        if (totalLength < 44)
        throw new IllegalArgumentException("Total length must be at least 44 bytes");

        ByteBuffer buffer = ByteBuffer.allocate(44);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        buffer.put((byte) 'R');
        buffer.put((byte) 'I');
        buffer.put((byte) 'F');
        buffer.put((byte) 'F');

        buffer.putInt(totalLength - 8);

        buffer.put((byte) 'W');
        buffer.put((byte) 'A');
        buffer.put((byte) 'V');
        buffer.put((byte) 'E');

        buffer.put((byte) 'f');
        buffer.put((byte) 'm');
        buffer.put((byte) 't');
        buffer.put((byte) ' ');

        buffer.putInt(16);
        buffer.putShort((short) 1);
        buffer.putShort((short) 1);
        buffer.putInt(16000);
        buffer.putInt(32000);
        buffer.putShort((short) 2);
        buffer.putShort((short) 16);

        buffer.put((byte) 'd');
        buffer.put((byte) 'a');
        buffer.put((byte) 't');
        buffer.put((byte) 'a');

        buffer.putInt(totalLength - 44);
        buffer.position(0);

        byte[] bytes = new byte[buffer.limit()];
        buffer.get(bytes);

        return bytes;
    }

    public static int getAudioDuration(String audioFilePath) throws IOException {
        String[] command = {
            "-i", audioFilePath,
            "-f", "null", // Null output format
            "-vn",        // Suppress video output
            "/dev/null"   // Redirect output to null
        };
        FFmpeg.execute(command);
        String output = Config.getLastCommandOutput();

        Pattern pattern = Pattern.compile("Duration: (\\d{2}):(\\d{2}):(\\d{2})\\.(\\d{2})");
        Matcher matcher = pattern.matcher(output);

        if (matcher.find()) {
            int hours = Integer.parseInt(matcher.group(1));
            int minutes = Integer.parseInt(matcher.group(2));
            int seconds = Integer.parseInt(matcher.group(3));
            return hours * 3600 + minutes * 60 + seconds;
        } else {
            throw new IOException("Could not determine the duration of the audio file.");
        }
    }


    // public String convertMp3ToRawPcm(String mp3Path) throws IOException {
    //     String pcmPath = mp3Path.substring(0, mp3Path.lastIndexOf('.')) + ".pcm";
    
    //     FutureTask<Boolean> task = new FutureTask<>(new Callable<Boolean>() {
    //         @Override
    //         public Boolean call() {
    //             // FFmpeg command to convert MP3 to raw PCM
    //             String[] command = {
    //                 "-y",                 // Overwrite output files
    //                 "-i", mp3Path,
    //                 "-ac", "1",           // Number of audio channels
    //                 "-ar", "16000",       // Audio sampling rate
    //                 "-f", "s16le",        // Raw PCM format
    //                 pcmPath
    //             };
    
    //             int returnCode = FFmpeg.execute(command);
    //             if (returnCode == Config.RETURN_CODE_SUCCESS) {
    //                 Log.i(LOG_TAG, "Conversion successful: " + pcmPath);
    //                 return true;
    //             } else {
    //                 Log.e(LOG_TAG, "Conversion failed with return code: " + returnCode);
    //                 return false;
    //             }
    //         }
    //     });
    
    //     new Thread(task).start();
    //     try {
    //         task.get(); // Wait for the task to complete
    //     } catch (Exception e) {
    //         e.printStackTrace();
    //     }
    //     return pcmPath;
    // }

    // public float[] readPcmFile(String pcmPath, int sampleRate, int numChannels) throws IOException {
    //     FileInputStream fis = new FileInputStream(pcmPath);
    //     FileChannel fileChannel = fis.getChannel();
    //     ByteBuffer byteBuffer = ByteBuffer.allocateDirect((int) fileChannel.size());
    //     fileChannel.read(byteBuffer);
    //     byteBuffer.rewind();

    //     // Convert bytes to shorts (16-bit PCM samples)
    //     ShortBuffer shortBuffer = byteBuffer.asShortBuffer();
    //     int numSamples = shortBuffer.remaining();
    //     float[] floatArray = new float[numSamples];
    //     for (int i = 0; i < numSamples; i++) {
    //         floatArray[i] = shortBuffer.get(i) / 32768.0f; // Convert 16-bit PCM to float [-1.0, 1.0]
    //     }

    //     fis.close();
    //     return floatArray;
    // }


    // public String convertMp3ToWav(String mp3Path) throws IOException {
    //     // Ensure the MP3 file exists
    //     File mp3File = new File(mp3Path);
    //     if (!mp3File.exists()) {
    //         throw new IOException("MP3 file does not exist: " + mp3Path);
    //     }

    //     // Define the path for the output WAV file
    //     String wavPath = mp3Path.substring(0, mp3Path.lastIndexOf('.')) + ".wav";

    //     // Define the FFmpeg command
    //     String cmd = "-i " + mp3Path + " " + wavPath;

    //     // Execute the FFmpeg command asynchronously
    //     FFmpeg.executeAsync(cmd, (executionId, returnCode) -> {
    //         if (returnCode == Config.RETURN_CODE_SUCCESS) {
    //             // Handle success
    //             System.out.println("Conversion successful: " + wavPath);
    //         } else {
    //             // Handle failure
    //             System.err.println("Conversion failed with return code: " + returnCode);
    //         }
    //     });

    //     // Return the path to the WAV file
    //     return wavPath;
    // }

    // public String convertMp3ToWav(String mp3Path) throws IOException {
    //     MediaExtractor extractor = new MediaExtractor();
    //     extractor.setDataSource(mp3Path);
    
    //     int audioTrackIndex = -1;
    //     MediaFormat format = null;
    
    //     // Find the first audio track in the file
    //     for (int i = 0; i < extractor.getTrackCount(); i++) {
    //         format = extractor.getTrackFormat(i);
    //         String mime = format.getString(MediaFormat.KEY_MIME);
    //         if (mime.startsWith("audio/")) {
    //             audioTrackIndex = i;
    //             break;
    //         }
    //     }
    
    //     if (audioTrackIndex == -1) {
    //         throw new IOException("No audio track found in " + mp3Path);
    //     }
    
    //     extractor.selectTrack(audioTrackIndex);
    
    //     MediaCodec codec = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME));
    //     codec.configure(format, null, null, 0);
    //     codec.start();
    
    //     ByteBuffer[] inputBuffers = codec.getInputBuffers();
    //     ByteBuffer[] outputBuffers = codec.getOutputBuffers();
    
    //     MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
    
    //     String wavPath = mp3Path.replace(".mp3", ".wav");
    //     FileOutputStream wavFile = new FileOutputStream(wavPath);
    
    //     // Write the WAV header
    //     writeWavHeader(wavFile, format);
    
    //     boolean sawInputEOS = false;
    //     boolean sawOutputEOS = false;
    
    //     while (!sawOutputEOS) {
    //         if (!sawInputEOS) {
    //             int inputBufferIndex = codec.dequeueInputBuffer(10000);
    //             if (inputBufferIndex >= 0) {
    //                 ByteBuffer inputBuffer = inputBuffers[inputBufferIndex];
    //                 int sampleSize = extractor.readSampleData(inputBuffer, 0);
    
    //                 if (sampleSize < 0) {
    //                     sawInputEOS = true;
    //                     sampleSize = 0;
    //                 } else {
    //                     extractor.advance();
    //                 }
    
    //                 codec.queueInputBuffer(inputBufferIndex, 0, sampleSize, extractor.getSampleTime(),
    //                         sawInputEOS ? MediaCodec.BUFFER_FLAG_END_OF_STREAM : 0);
    //             }
    //         }
    
    //         int outputBufferIndex = codec.dequeueOutputBuffer(info, 10000);
    //         if (outputBufferIndex >= 0) {
    //             ByteBuffer outputBuffer = outputBuffers[outputBufferIndex];
    
    //             if (info.size != 0) {
    //                 byte[] pcmData = new byte[info.size];
    //                 outputBuffer.get(pcmData);
    //                 wavFile.write(pcmData);
    //             }
    
    //             outputBuffer.clear();
    //             codec.releaseOutputBuffer(outputBufferIndex, false);
    
    //             if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
    //                 sawOutputEOS = true;
    //             }
    //         }
    //     }
    
    //     codec.stop();
    //     codec.release();
    //     extractor.release();
    
    //     // Update the WAV header with correct sizes
    //     updateWavHeader(wavFile);
    
    //     wavFile.close();
    
    //     return wavPath;
    // }
    
    // private void writeWavHeader(FileOutputStream out, MediaFormat format) throws IOException {
    //     int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
    //     int channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
    //     int bitDepth = 16;
    
    //     byte[] header = new byte[44];
    //     header[0] = 'R';
    //     header[1] = 'I';
    //     header[2] = 'F';
    //     header[3] = 'F';
    
    //     // Placeholder for file size
    //     header[4] = 0;
    //     header[5] = 0;
    //     header[6] = 0;
    //     header[7] = 0;
    
    //     header[8] = 'W';
    //     header[9] = 'A';
    //     header[10] = 'V';
    //     header[11] = 'E';
    //     header[12] = 'f';
    //     header[13] = 'm';
    //     header[14] = 't';
    //     header[15] = ' ';
    
    //     header[16] = 16;
    //     header[17] = 0;
    //     header[18] = 0;
    //     header[19] = 0;
    //     header[20] = 1;
    //     header[21] = 0;
    //     header[22] = (byte) channels;
    //     header[23] = 0;
    //     header[24] = (byte) (sampleRate & 0xff);
    //     header[25] = (byte) ((sampleRate >> 8) & 0xff);
    //     header[26] = (byte) ((sampleRate >> 16) & 0xff);
    //     header[27] = (byte) ((sampleRate >> 24) & 0xff);
    //     int byteRate = sampleRate * channels * bitDepth / 8;
    //     header[28] = (byte) (byteRate & 0xff);
    //     header[29] = (byte) ((byteRate >> 8) & 0xff);
    //     header[30] = (byte) ((byteRate >> 16) & 0xff);
    //     header[31] = (byte) ((byteRate >> 24) & 0xff);
    //     header[32] = (byte) (channels * bitDepth / 8);
    //     header[33] = 0;
    //     header[34] = (byte) bitDepth;
    //     header[35] = 0;
    //     header[36] = 'd';
    //     header[37] = 'a';
    //     header[38] = 't';
    //     header[39] = 'a';
    
    //     // Placeholder for data size
    //     header[40] = 0;
    //     header[41] = 0;
    //     header[42] = 0;
    //     header[43] = 0;
    
    //     out.write(header, 0, 44);
    // }
    
    // private void updateWavHeader(FileOutputStream out) throws IOException {
    //     long fileSize = out.getChannel().size();
    //     out.getChannel().position(4);
    //     out.write((int) ((fileSize - 8) & 0xff));
    //     out.write((int) (((fileSize - 8) >> 8) & 0xff));
    //     out.write((int) (((fileSize - 8) >> 16) & 0xff));
    //     out.write((int) (((fileSize - 8) >> 24) & 0xff));
    
    //     out.getChannel().position(40);
    //     out.write((int) ((fileSize - 44) & 0xff));
    //     out.write((int) (((fileSize - 44) >> 8) & 0xff));
    //     out.write((int) (((fileSize - 44) >> 16) & 0xff));
    //     out.write((int) (((fileSize - 44) >> 24) & 0xff));
    // }


    // public String convertMp3ToWav(String mp3Path) throws IOException {
    //     String wavPath = getWavFilePath(mp3Path);

    //     MediaExtractor extractor = new MediaExtractor();
    //     extractor.setDataSource(mp3Path);
    //     MediaFormat format = extractor.getTrackFormat(0);
    //     extractor.selectTrack(0);

    //     int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
    //     int channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);

    //     MediaCodec decoder = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME));
    //     decoder.configure(format, null, null, 0);
    //     decoder.start();

    //     FileOutputStream wavOutputStream = new FileOutputStream(wavPath);
    //     writeWavHeader(wavOutputStream, sampleRate, channels);

    //     ByteBuffer inputBuffer;
    //     ByteBuffer outputBuffer;
    //     MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();

    //     while (true) {
    //         int inputBufferIndex = decoder.dequeueInputBuffer(10000);
    //         if (inputBufferIndex >= 0) {
    //             inputBuffer = decoder.getInputBuffer(inputBufferIndex);
    //             int sampleSize = extractor.readSampleData(inputBuffer, 0);
    //             if (sampleSize < 0) {
    //                 decoder.queueInputBuffer(inputBufferIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
    //                 break;
    //             } else {
    //                 decoder.queueInputBuffer(inputBufferIndex, 0, sampleSize, extractor.getSampleTime(), 0);
    //                 extractor.advance();
    //             }
    //         }

    //         int outputBufferIndex = decoder.dequeueOutputBuffer(bufferInfo, 10000);
    //         if (outputBufferIndex >= 0) {
    //             outputBuffer = decoder.getOutputBuffer(outputBufferIndex);
    //             byte[] chunk = new byte[bufferInfo.size];
    //             outputBuffer.get(chunk);
    //             outputBuffer.clear();
    //             writePcmDataAs16Bit(wavOutputStream, chunk, bufferInfo.size, channels);
    //             decoder.releaseOutputBuffer(outputBufferIndex, false);
    //         } else if (outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
    //             // Subsequent data will conform to new format.
    //             MediaFormat newFormat = decoder.getOutputFormat();
    //         }
    //     }

    //     decoder.stop();
    //     decoder.release();
    //     extractor.release();

    //     wavOutputStream.close();

    //     updateWavHeader(wavPath);

    //     return wavPath;
    // }

    // private void writePcmDataAs16Bit(FileOutputStream out, byte[] chunk, int size, int channels) throws IOException {
    //     ByteBuffer byteBuffer = ByteBuffer.wrap(chunk);
    //     while (byteBuffer.hasRemaining()) {
    //         float sample = byteBuffer.getFloat();
    //         short sample16bit = (short) (sample * 32767.0f);
    //         for (int i = 0; i < channels; i++) {
    //             out.write((sample16bit & 0xff));
    //             out.write((sample16bit >> 8) & 0xff);
    //         }
    //     }
    // }

    // public static String getWavFilePath(String mp3FilePath) {
    //     File mp3File = new File(mp3FilePath);
    //     String parentDir = mp3File.getParent();
    //     String fileNameWithoutExtension = mp3File.getName().replaceFirst("[.][^.]+$", ""); // Remove the extension
    //     return parentDir + File.separator + fileNameWithoutExtension + ".wav";
    // }

    // private void writeWavHeader(FileOutputStream out, int sampleRate, int channels) throws IOException {
    //     int byteRate = sampleRate * channels * 2;  // 16 bit PCM
    //     out.write(new byte[]{
    //         'R', 'I', 'F', 'F',  // ChunkID
    //         0, 0, 0, 0,  // ChunkSize (filled later)
    //         'W', 'A', 'V', 'E',  // Format
    //         'f', 'm', 't', ' ',  // Subchunk1ID
    //         16, 0, 0, 0,  // Subchunk1Size (16 for PCM)
    //         1, 0,  // AudioFormat (1 for PCM)
    //         (byte) channels, 0,  // NumChannels
    //         (byte) (sampleRate & 0xff), (byte) ((sampleRate >> 8) & 0xff), (byte) ((sampleRate >> 16) & 0xff), (byte) ((sampleRate >> 24) & 0xff),  // SampleRate
    //         (byte) (byteRate & 0xff), (byte) ((byteRate >> 8) & 0xff), (byte) ((byteRate >> 16) & 0xff), (byte) ((byteRate >> 24) & 0xff),  // ByteRate
    //         (byte) (channels * 2), 0,  // BlockAlign
    //         16, 0,  // BitsPerSample
    //         'd', 'a', 't', 'a',  // Subchunk2ID
    //         0, 0, 0, 0  // Subchunk2Size (filled later)
    //     });
    // }

    // private void updateWavHeader(String wavPath) throws IOException {
    //     RandomAccessFile wavFile = new RandomAccessFile(wavPath, "rw");
    //     wavFile.seek(4);
    //     long fileSize = wavFile.length() - 8;
    //     wavFile.write(new byte[]{
    //         (byte) (fileSize & 0xff),
    //         (byte) ((fileSize >> 8) & 0xff),
    //         (byte) ((fileSize >> 16) & 0xff),
    //         (byte) ((fileSize >> 24) & 0xff)
    //     });

    //     wavFile.seek(40);
    //     long dataSize = fileSize - 36;
    //     wavFile.write(new byte[]{
    //         (byte) (dataSize & 0xff),
    //         (byte) ((dataSize >> 8) & 0xff),
    //         (byte) ((dataSize >> 16) & 0xff),
    //         (byte) ((dataSize >> 24) & 0xff)
    //     });

    //     wavFile.close();
    // }
}