# FalaQui Server Requirements for Linux Ubuntu Documentation

## About
Welcome to the FalaQui server requirements instructions for Linux Ubuntu. Open the terminal and run the following steps:

---

### System Package Update
```bash
sudo apt update
```

---

### Build Essential (to build C/C++)
```bash
sudo apt install -y build-essential
```

---

### Lib CURL
```bash
sudo apt install -y curl
```

---

### Lib FFmpeg
```bash
sudo apt install ffmpeg
```

---

### Lib ImageMagick
```bash
sudo apt install imagemagick
```

---

### Lib PNGQuant
```bash
sudo apt install pngquant
```

---

### Lib Lame
```bash
sudo apt install lame
```

---

### Lib MP3Info
```bash
sudo apt install mp3info
```

---

### NodeJS 23 or Later
```bash
curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
```

---

### PM2 (to use as a daemon process manager)
```bash
sudo npm install pm2@latest -g
```

---

### Redis Server (to cache server data traffic)
```bash
sudo apt install redis-server
sudo systemctl enable redis-server.service
```

---

### MySQL Database Server
Configure your database server with a username and password to be accessible by the FalaQui Server.
```bash
sudo apt install mysql-server
sudo systemctl start mysql.service
```

Use the initial.sql script to create the database and tables on your MySQL server.
| Creation Database Script                                                                |
|-----------------------------------------------------------------------------------------|
| [initial.sql](https://github.com/falaqui-open/chat/blob/main/docs/database/initial.sql) |

---

### Python Package Installer
```bash
sudo apt install python3-pip
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