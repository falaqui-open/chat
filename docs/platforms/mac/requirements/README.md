# FalaQui Server Requirements for MacOS Documentation

## About
Welcome to the FalaQui server requirements instructions for MacOS. Open the terminal and run the following steps:

---

### System Package Update
```bash
brew update
```

---

### XCode Command-line tools
First, download and install Xcode from the Mac App Store (get it from https://appstore.com/mac/apple/xcode) if you don't have it yet. 
*Note: XCode is a large download (several GBs) and may take some time to install.*

Ensure Xcode app is in the /Applications directory (not in the /Users/{user}/Applications).
```bash
if [ -d /Applications/Xcode.app ]; then echo '✅ OK'; else echo '⛔️ Wrong XCode directory'; fi
```
Expected response: ✅ OK

After XCode installation open the terminal and run the following command to install Xcode's command-line tools:
```bash
sudo xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

---

### Lib FFmpeg
```bash
brew install ffmpeg
```

---

### Lib ImageMagick
```bash
brew install imagemagick
```

---

### Lib PNGQuant
```bash
brew install pngquant
```

---

### Lib Lame
```bash
brew install lame
```

---

### Lib MP3Info
```bash
brew install mp3info
```

---

### NodeJS 23 or Later
```bash
brew install node
```

Verify the NodeJS and NPM version to make sure that your Homebrew has the latest version of the Node package:
```bash
node -v
npm -v
```

Note: If you need a newer version of NodeJS, run the following command to update version of node:
```bash
brew update
brew upgrade node
```

---

### PM2 (to use as a daemon process manager)
```bash
sudo npm install pm2@latest -g
```

---

### Redis Server (to cache server data traffic)
```bash
brew install redis
```

Start the Redis server service:
```bash
brew services start redis
```

Test the redis-cli connection:
```bash
redis-cli PING
```
Expected result: PONG

---

### MySQL Database Server
Configure your database server with a username and password to be accessible by the FalaQui Server.

Install MySQL using Homebrew:
```bash
brew install mysql
brew services start mysql
```
Alternatively, you can download and install MySQL Community Server from the official website:
1. Download the package from http://dev.mysql.com/downloads/shell/.
2. Double-click the downloaded DMG to mount it. Finder opens.
3. Double-click the .pkg file shown in the Finder window.
4. Follow the steps in the installation wizard.
5. When the installer finishes, eject the DMG. (It can be deleted.)

Use the initial.sql script to create the database and tables on your MySQL server.
| Creation Database Script                                                                |
|-----------------------------------------------------------------------------------------|
| [initial.sql](https://github.com/falaqui-open/chat/blob/main/docs/database/initial.sql) |

---

### Python Package Installer
```bash
brew install python
```

---

### Open Whisper Python Package
```bash
pip3 install openai-whisper --break-system-packages
```

---

### Configure your .env file
Check the .env-template file to create your own .env file.

```
PORT=24011
WSSPORT=24012
DB_HOST=localhost
DB_USER=dbuser
DB_PASSWORD=ChangeMe
DB_NAME=flq
DB_MULTIPLE_STATEMENTS=true
DB_CONNECT_TIMEOUT=160000
DB_CONNECTION_LIMIT=100
DB_ACQUIRE_TIMEOUT=160000
DB_WAIT_FOR_CONNECTIONS=true
DB_QUEUE_LIMIT=0
CONNECTION_CHARSET=utf8mb4_unicode_ci
CACHE_PREFIX=FLQ_
CACHE_MINUTES=120
ENCRYPT_PASSPHRASE='generate a new unique word list'
TOKEN_SECRET='genereate a new token secret'
SESSION_SECRET='generate a new session secret'
SMS_CLICKSEND_USERNAME='your-clicksend-email@email-provider.com'
SMS_CLICKSEND_APIKEY='00000000-0000-0000-0000-000000000000'
SMS_CLICKSEND_URL='https://rest.clicksend.com/v3/sms/send'
```

---


### Additional Notes:
- **Homebrew**: Ensure that Homebrew is installed on the system. If not, you can add a note at the beginning of the document explaining how to install it:
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"