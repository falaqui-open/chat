const fs        = require('fs');
const path      = require('path');
const { exec }  = require('child_process');
// const  wavefile = require('wavefile');

module.exports = {
    getWavAudioData: function(audioPath)
    {
        return getWavAudioData(audioPath);
    },
    getTranscription: function(audioPath)
    {
        return getTranscription(audioPath);
    },
    wavToMP3: function(audioPath)
    {
        return wavToMP3(audioPath);
    },
    reduceSize: function(audioPath)
    {
        return reduceSize(audioPath);
    },
    remove: function(audioPath)
    {
        return remove(audioPath);
    },
    move: function(oldPath, newPath)
    {
        return move(oldPath, newPath);
    },
    getTotalPlayingTimeInSeconds: function(audioPath)
    {
        return getTotalPlayingTimeInSeconds(audioPath);
    }
}

function getWavAudioData(audioPath)
{
    // const fileData = fs.readFileSync(audioPath);
    // let wav = new wavefile.WaveFile(fileData);
    // wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
    // wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000

    // // If the file is stereo or have more than one channel then the samples will be returned de-interleaved in a Array of Float64Array objects, 
    // // one Float64Array for each channel. The method takes a optional boolean param interleaved, set to false by default. If set to true, 
    // // samples will be returned interleaved. Default is de-interleaved.

    // // To get interleaved samples
    // let audioData = wav.getSamples(true);
    // return audioData;
}

async function getTranscription(audioPath)
{
    // sudo apt install python3
    // sudo apt install python3-pip
    // pip install openai-whisper (Or pip3 install openai-whisper --break-system-packages)
    // sudo apt install ffmpeg
    // Test command: 
    //      cd ./local_modules/media
    //      python3 transcript.py test-transcript.mp3 test-transcript.txt

    const transcriptScriptPath = path.resolve(`${__dirname}/../../local_modules/media/transcript.py`);
    const tmpFile = `transcript_${makeid(6)}.txt`;
    const fileDir = path.dirname(audioPath);
    const tmpFilePath = path.join(fileDir, tmpFile);

    const command = `python3 -W ignore "${transcriptScriptPath}" "${audioPath}" "${tmpFilePath}"`;
    const commandResult = await executeTerminalCommand(command);

    const fileData = fs.readFileSync(tmpFilePath, 'utf8');
    remove(tmpFilePath);

    return fileData;
}

async function wavToMP3(audioPath)
{
    // Convert: sudo apt install ffmpeg or brew install ffmpeg
    
    // Eg.: ffmpeg -i audio.wav -vn -ar 44100 -ac 2 -b:a 96k audio.mp3
    /*
        -i - input file
        -vn - Disable video, to make sure no video (including album cover image) is included if the source would be a video file
        -ar - Set the audio sampling frequency. For output streams it is set by default to the frequency of the corresponding input stream. For input streams this option only makes sense for audio grabbing devices and raw demuxers and is mapped to the corresponding demuxer options.
        -ac - Set the number of audio channels. For output streams it is set by default to the number of input audio channels. For input streams this option only makes sense for audio grabbing devices and raw demuxers and is mapped to the corresponding demuxer options. So used here to make sure it is stereo (2 channels)
        -b:a 96k - Converts the audio bit-rate to be exact 96 KB/s (96 kibibit per second).
            32 kbit/s – generally acceptable only for speech
            96 kbit/s – generally used for speech or low-quality streaming
            128 or 160 kbit/s – mid-range bitrate quality
            192 kbit/s – medium quality bitrate
            256 kbit/s – a commonly used high-quality bitrate
            320 kbit/s – highest level supported by the MP3 standard
    */

    const fileDir = path.dirname(audioPath);
    const fileBaseName = path.basename(audioPath);
    const fileBaseNameWithoutExtenstion = fileBaseName.split(`.`)[0];

    const mp3Path = path.join(fileDir, `${fileBaseNameWithoutExtenstion}.mp3`);

    const commandReduce = `ffmpeg -hide_banner -loglevel error -i "${audioPath}" -vn -ar 44100 -ac 2 -b:a 96k "${mp3Path}"`;
    const commandResult = await executeTerminalCommand(commandReduce);

    remove(audioPath);

    return mp3Path;
}

async function reduceSize(audioPath)
{
    // Convert: sudo apt install lame or brew install lame
    // Eg.: lame -V9 --scale 2 voice.mp3 o2Voice.mp3

    const tmpFile = `${makeid(6)}.mp3`;
    const fileDir = path.dirname(audioPath);
    const tmpFilePath = path.join(fileDir, tmpFile);

    const commandReduce = `lame --silent -V9 --scale 2 "${audioPath}" ${tmpFilePath}`;
    const commandResult = await executeTerminalCommand(commandReduce);

    remove(audioPath);
    move(tmpFilePath, audioPath);
}

async function getTotalPlayingTimeInSeconds(audioPath)
{
    // sudo apt install mp3info or brew install mp3info
    // Eg.: mp3info -p "%S\n" o2Voice.mp3
    // const commandReduce = `mp3info -p "%S/\\n "${audioPath}"`;
    // const commandResult = await executeTerminalCommand(commandReduce);
    // return commandResult;

    const FALLBACK_ERR_RESULT = 1;
    let commandResult = 0;
    try
    {
        // sudo apt install ffmpeg or brew install ffmpeg
        const commandReduce = `ffprobe -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}" 2>/dev/null`;
        commandResult = await executeTerminalCommand(commandReduce);
    }
    catch(getTimeErr)
    {
        console.log(`Error getting the time of the audio file: ${getTimeErr}`);
        commandResult = FALLBACK_ERR_RESULT;
    }

    return commandResult;
}

function remove(filePath)
{
    fs.unlinkSync(filePath);
}

function move(oldPath, newPath)
{
    fs.renameSync(oldPath, newPath);
}

function executeTerminalCommand(command) 
{
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) 
            {
                reject(error);
                return;
            }
            
            if (stderr) 
            {
                reject(stderr);
                return;
            }

            resolve(stdout);
        });
    });
}

function makeid(size) 
{
    var text = "";
    var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVXWYZabcdefghijklmnopqrstuvxwyz";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function makeidnum(size) 
{
    var text = "";
    var possible = "0123456789";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}