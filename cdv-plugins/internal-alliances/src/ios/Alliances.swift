// Alliances.swift
import Foundation
import AVFoundation
import mobileffmpeg

@objc(Alliances)
class Alliances : CDVPlugin 
{
    @objc(getVersion:)
    func getVersion(command: CDVInvokedUrlCommand) 
    {
        let version = "1.0.0"
        let nativeVersion = String(validatingUTF8: c_getVersion())
        // let nativeppVersion = String(validatingUTF8: cpp_getVersion())
        let nativeppVersion = "Not implemented"

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "version": version,
                "native": nativeVersion,
                "nativepp": nativeppVersion
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }


    @objc(audioProcessing:)
    func audioProcessing(command: CDVInvokedUrlCommand) 
    {
        let audioPath = command.arguments[0] as? String ?? ""

        NSLog("Audio Processing Call: " + audioPath)

        if let fileURL = URL(string: audioPath) 
        {
            let filePath = fileURL.path

            let fileManager = FileManager.default
            if fileManager.fileExists(atPath: filePath) 
            {
                print("Audio File Exists: true")

                filePath.withCString { nativeFileExistsPointer in
                    let nativeFileExists = String(validatingUTF8: c_fileExists(UnsafeMutablePointer(mutating: nativeFileExistsPointer)))
                    print("Audio File Exists Native: " + (nativeFileExists ?? "Unknown"))
                }
            } 
            else 
            {
                print("Audio File Exists: false")
            }        
        }
        else 
        {
            print("Invalid file URL")
        }

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "result": "OK"
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }

    @objc(startHTTPServer:)
    func startHTTPServer(command: CDVInvokedUrlCommand) 
    {
        let publicPath = command.arguments[0] as? String ?? ""
        let port = command.arguments[1] as? Int ?? 0
        var responseText = "OK" // Use 'var' so we can modify it

        // Check if the public path and port are valid
        guard !publicPath.isEmpty && port > 0 else {
            responseText = "Invalid public path or port"
            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_ERROR,
                messageAs: [
                    "responseText": responseText
                ]
            )

            self.commandDelegate!.send(
                pluginResult,
                callbackId: command.callbackId
            )
            return
        }

        // Start the server
        publicPath.withCString { nativePublicPath in
            let nativePort = Int32(port)  // Convert to Int32
            cStartHTTPServer(nativePublicPath, nativePort)
        }

        // You can add some log or state check here if cStartHTTPServer sets some global error state

        // Send the plugin result
        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "responseText": responseText
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }

    @objc(stopHTTPServer:)
    func stopHTTPServer(command: CDVInvokedUrlCommand) 
    {
        let version = "1.0.0"
        cStopHTTPServer()
        let responseText = "OK"

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "responseText": responseText
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }

    @objc(transcribeAudio:)
    func transcribeAudio(command: CDVInvokedUrlCommand) 
    {
        let audioPath = command.arguments[0] as? String ?? ""
        let whLanguage = command.arguments[1] as? String ?? ""
        let whDuration = command.arguments[2] as? Int ?? 0
        let isMP3 = command.arguments[3] as? Bool ?? false

        print("Audio Processing Call: (lang \(whLanguage) max duration: \(whDuration), MP3 \(isMP3)): \(audioPath)")

        var audioTranscription = ""
        var audioDurationSec = 0

        if let fileURL = URL(string: audioPath) 
        {
            let filePath = fileURL.path

            let fileManager = FileManager.default
            if fileManager.fileExists(atPath: filePath) 
            {
                // Convert MP3 to WAV PCM 16 if needed and decode samples
                do 
                {
                    var wavPath = ""
                    var samples = [Float]()

                    print("🟡 1 - Audio conversion: \(filePath)...")
                    
                    if isMP3
                    {
                        wavPath = try convertMp3ToWav(mp3Path: filePath)
                    } 
                    else 
                    {
                        wavPath = try convertWavToPCM16(wavPath: filePath)
                    }
                    
                    print("🟡 2 - Audio conversion result: \(wavPath)...")

                    samples = try decodeWaveFile(wavFilePath: wavPath)
                    
                    print("🟡 3 - Audio samples result: \(samples)...")

                    var whDurationToProcess = whDuration

                    do {
                        print("🟡 4 - Audio duration reading: \(wavPath)...")
                        let audioDuration = try getAudioDuration(audioFilePath: wavPath)
                        audioDurationSec = audioDuration

                        print("🟡 5 - Current audio duration: \(audioDuration) seconds")
                        
                        if (audioDuration * 1000) < whDuration {
                            whDurationToProcess = audioDuration * 1000
                        }
                        
                        // Now you can use whDurationToProcess for further processing
                    } catch {
                        print("Failed to get audio duration: \(error.localizedDescription)")
                    }

                    wavPath.withCString { nativeFilePath in
                        guard let modelFileURL = Bundle.main.url(forResource: "ggml-base", withExtension: "bin") else {
                            print("Model file not found in bundle")
                            return
                        }
                        let modelPath = modelFileURL.path

                        modelPath.withCString { nativeModelPath in
                            whLanguage.withCString { nativeLanguage in
                                let nativeDuration = Int32(whDurationToProcess)  // Convert to Int32
                                samples.withUnsafeBufferPointer { samplesBuffer in
                                    let samplesPointer = UnsafeMutablePointer(mutating: samplesBuffer.baseAddress)
                                    let sampleSize = samples.count
                                    let nativeTranscriptionPointer = c_transcribeAudio(nativeFilePath, nativeModelPath, samplesPointer, sampleSize, nativeLanguage, nativeDuration)
                                    if let nativeTranscription = nativeTranscriptionPointer {
                                        audioTranscription = String(validatingUTF8: nativeTranscription) ?? ""
                                        // Free the C-allocated memory if needed
                                        // free(nativeTranscriptionPointer)
                                    }
                                }
                            }
                        }
                    }

                } catch {
                    print("Error processing audio file: \(error)")
                }
            } 
            else 
            {
                print("Audio File Exists: false")
            }        
        }
        else 
        {
            print("Invalid file URL")
        }

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "result": audioTranscription,
                "audioDurationSec": audioDurationSec
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }


    @objc(wav2mp3:)
    func wav2mp3(command: CDVInvokedUrlCommand) 
    {
        let wavPath = command.arguments[0] as? String ?? ""

        NSLog("Wav2MP3 Call: \(wavPath)")

        do {
            let mp3Path = try convertWavToMp3(wavPath: wavPath)

            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: [
                    "result": mp3Path
                ]
            )

            self.commandDelegate!.send(
                pluginResult,
                callbackId: command.callbackId
            )
        } catch {
            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_ERROR,
                messageAs: error.localizedDescription
            )

            self.commandDelegate!.send(
                pluginResult,
                callbackId: command.callbackId
            )
        }
    }



    // Convert MP3 to WAV PCM 16
    func convertMp3ToWav(mp3Path: String) throws -> String {
        let wavPath = (mp3Path as NSString).deletingPathExtension + ".wav"

        let command = [
            "-y",
            "-i", mp3Path,
            "-ac", "1",
            "-ar", "16000",
            "-sample_fmt", "s16",
            "-c:a", "pcm_s16le",
            "-f", "wav",
            wavPath
        ]

        let returnCode = MobileFFmpeg.execute(withArguments: command)
        if returnCode == RETURN_CODE_SUCCESS {
            print("Conversion successful: \(wavPath)")
            return wavPath
        } else {
            throw NSError(domain: "ffmpeg", code: Int(returnCode), userInfo: [NSLocalizedDescriptionKey: "Failed to convert MP3 to WAV"])
        }
    }

    func convertWavToMp3(wavPath: String) throws -> String {
        let mp3Path = (wavPath as NSString).deletingPathExtension + ".mp3"
        print("Converting WAV to MP3: \(wavPath) to \(mp3Path)")

        let command = [
            "-y",
            "-i", wavPath,
            "-vn",
            "-ar", "44100",
            "-ac", "2",
            "-b:a", "96k",
            "-f", "mp3",
            mp3Path
        ]

        let returnCode = MobileFFmpeg.execute(withArguments: command)
        print("FFmpeg execute return code: \(returnCode)")
        if returnCode == RETURN_CODE_SUCCESS {
            print("Conversion successful: \(mp3Path)")

            // Verify the file exists using URL
            if let mp3URL = URL(string: mp3Path), FileManager.default.fileExists(atPath: mp3URL.path) {
                print("MP3 file exists: \(mp3Path)")
                return mp3Path
            } else {
                print("MP3 file not found after conversion: \(mp3Path)")
                throw NSError(domain: "ffmpeg", code: -1, userInfo: [NSLocalizedDescriptionKey: "MP3 file not found after conversion"])
            }
        } else {
            print("Conversion failed with return code: \(returnCode)")
            throw NSError(domain: "ffmpeg", code: Int(returnCode), userInfo: [NSLocalizedDescriptionKey: "Failed to convert WAV to MP3"])
        }
    }

    func convertWavToPCM16(wavPath: String) throws -> String {
        let pcmPath = (wavPath as NSString).deletingPathExtension + "_pcm16.wav"
        let command = [
            "-y",
            "-i", wavPath,
            "-ac", "1",
            "-ar", "16000",
            "-sample_fmt", "s16",
            "-c:a", "pcm_s16le",
            "-f", "wav",
            pcmPath
        ]

        var returnCode: Int32 = -1
        let semaphore = DispatchSemaphore(value: 0)
        
        DispatchQueue.global().async {
            returnCode = MobileFFmpeg.execute(withArguments: command)
            semaphore.signal()
        }

        semaphore.wait()
        
        if returnCode == RETURN_CODE_SUCCESS {
            print("Conversion successful: \(pcmPath)")
            return pcmPath
        } else {
            throw NSError(domain: "ffmpeg", code: Int(returnCode), userInfo: [NSLocalizedDescriptionKey: "Failed to convert WAV to PCM16"])
        }
    }

    // Decode WAV file to extract samples
    func decodeWaveFile(wavFilePath: String) throws -> [Float] {
        // Implement the decoding of the WAV file to extract samples
        // This can be done using libraries like AVFoundation or other audio processing libraries
        // Example using AVFoundation (simplified):
        let fileURL = URL(fileURLWithPath: wavFilePath)
        let file = try AVAudioFile(forReading: fileURL)
        let format = file.processingFormat
        let frameCount = UInt32(file.length)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!

        try file.read(into: buffer)

        let samples = buffer.floatChannelData?[0]
        let sampleArray = Array(UnsafeBufferPointer(start: samples, count: Int(frameCount)))

        return sampleArray
    }

    func getAudioDuration(audioFilePath: String) throws -> Int {
        let command = [
            "-i", audioFilePath,
            "-f", "null", // Null output format
            "-vn",        // Suppress video output
            "/dev/null"   // Redirect output to null
        ]

        var returnCode: Int32 = -1
        let semaphore = DispatchSemaphore(value: 0)
        
        DispatchQueue.global().async {
            returnCode = MobileFFmpeg.execute(withArguments: command)
            semaphore.signal()
        }

        semaphore.wait()
        
        guard returnCode == RETURN_CODE_SUCCESS else {
            throw NSError(domain: "FFmpegError", code: Int(returnCode), userInfo: [NSLocalizedDescriptionKey: "Failed to execute FFmpeg command"])
        }

        guard let output = MobileFFmpegConfig.getLastCommandOutput() else {
            throw NSError(domain: "FFmpegError", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to get FFmpeg command output"])
        }

        let regex = try! NSRegularExpression(pattern: "Duration: (\\d{2}):(\\d{2}):(\\d{2})\\.(\\d{2})")
        let nsString = output as NSString
        let results = regex.matches(in: nsString as String, range: NSRange(location: 0, length: nsString.length))
        
        guard let match = results.first else {
            throw NSError(domain: "FFmpegError", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not determine the duration of the audio file."])
        }
        
        let hours = Int(nsString.substring(with: match.range(at: 1))) ?? 0
        let minutes = Int(nsString.substring(with: match.range(at: 2))) ?? 0
        let seconds = Int(nsString.substring(with: match.range(at: 3))) ?? 0
        
        return hours * 3600 + minutes * 60 + seconds
    }
}
