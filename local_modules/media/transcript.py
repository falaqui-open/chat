# sudo apt install python3-pip
# pip install -U openai-whisper (Or pip3 install openai-whisper --break-system-packages)
# sudo apt install ffmpeg

# Run examples: 
#   python3 transcript.py "/Users/joaojunior/lab/flq/local_modules/media/test-transcript2.wav" "/Users/joaojunior/lab/flq/local_modules/media/test-transcript2.txt"
#   python3 transcript.py "/Users/joaojunior/lab/flq/local_modules/media/test-transcript.mp3" "/Users/joaojunior/lab/flq/local_modules/media/test-transcript.txt"
#   python3 transcript.py ./test-transcript.mp3 ./test-transcript.txt
#   python3 transcript.py test-transcript.mp3 test-transcript.txt

import whisper
import sys

if len(sys.argv) < 2:
    print("You must to inform the audio file path")
    exit(1)

if len(sys.argv) < 3:
    print("You must to inform the result text file path")
    exit(1)


audio = sys.argv[1]
txtResultPath = sys.argv[2]

model = whisper.load_model("base")
# audio = "test2.mp3"
result = model.transcribe(audio)

audioText = result["text"]
audioText = audioText.strip() # trim

# with open("transcription.txt", "w", encoding="utf-8") as txt:
with open(txtResultPath, "w", encoding="utf-8") as txt:
    txt.write(audioText)