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
