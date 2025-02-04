# FalaQui Server Requirements for Windows Documentation

## About
Welcome to the FalaQui server requirements instructions for Windows. Follow the steps below to set up your environment.

---

### Prerequisites
1. **Windows 10 or later**: Ensure your system is up to date.
2. **Administrator Access**: You will need administrator privileges to install software and configure services.

---

### Install Chocolatey (Package Manager for Windows)
Chocolatey is a package manager for Windows that simplifies software installation. Open PowerShell as Administrator and run the following command:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Verify the installation:
```powershell
choco --version
```

---

### System Package Update
Update Chocolatey and installed packages:
```powershell
choco upgrade chocolatey
```

---

### Build Tools (to build C/C++)
Install Visual Studio Build Tools:
```powershell
choco install visualstudio2022buildtools -y
```

---

### Lib CURL
CURL is usually included in Windows 10 and later. Verify its installation:
```powershell
curl --version
```

If not installed, download it from https://curl.se/windows/.

---

### Lib FFmpeg
Install FFmpeg using Chocolatey:
```powershell
choco install ffmpeg -y
```

---

### Lib ImageMagick
Install ImageMagick:
```powershell
choco install imagemagick -y
```

---

### Lib PNGQuant
Install PNGQuant:
```powershell
choco install pngquant -y
```

---

### Lib Lame
Install Lame:
```powershell
choco install lame -y
```

---

### Lib MP3Info
Install MP3Info:
```powershell
choco install mp3info -y
```

---

### NodeJS 23 or Later
Install NodeJS:
```powershell
choco install nodejs -y
```

Verify the NodeJS and NPM version:
```powershell
node -v
npm -v
```

---

### PM2 (to use as a daemon process manager)
Install PM2 globally:
```powershell
npm install pm2@latest -g
```

---

### Redis Server (to cache server data traffic)
Install Redis:
```powershell
choco install redis-64 -y
```

Start the Redis server:
```powershell
redis-server --service-start
```

Test the Redis connection:
```powershell
redis-cli PING
```
Expected result: `PONG`

---

### MySQL Database Server
Install MySQL:
```powershell
choco install mysql -y
```

Start MySQL service:
```powershell
Start-Service MySQL
```

Secure your MySQL installation:
```powershell
mysql_secure_installation
```

---

### Python Package Installer
Install Python:
```powershell
choco install python -y
```

Verify the installation:
```powershell
python --version
pip --version
```

---

### Open Whisper Python Package
Install Open Whisper:
```powershell
pip install openai-whisper
```

---

### Additional Notes
- **Environment Variables**: Ensure that the paths for NodeJS, Python, and other tools are added to your system's PATH environment variable.
- **Services**: Use `services.msc` to manage Redis and MySQL services.
- **PowerShell**: All commands are designed to be run in PowerShell with administrator privileges.

---

### Final Steps
After completing the setup, ensure all services (Redis, MySQL, etc.) are running and properly configured before starting the FalaQui server.