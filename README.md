# Falaqui - Open Source Chat Application

<img src="docs/img/falaqui-open-banner.png" alt="Falaqui Banner" />

**Falaqui** is a simple, private, and secure chat application designed for both personal and business use. With end-to-end encryption, offline message access, and support for text, media, audio transcripts, and more, Falaqui aims to be an open-source alternative to popular chat apps like WhatsApp and Telegram.

*This article can also be read in [Brazilian Portuguese](README-pt-BR.md).*

## Table of Contents
- [About](#about)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About

<img src="docs/img/falaqui-open-icon.png" alt="Falaqui Logo" width="200" />
Falaqui is an open-source chat application that prioritizes privacy and security. It allows users to send messages, share files, and communicate in groups with end-to-end encryption. Whether you're chatting with friends, family, or coworkers, Falaqui ensures your conversations remain private and secure.

### Motivation
The motivation behind Falaqui is to provide a transparent and secure alternative to closed-source chat applications that may collect or retain sensitive user data. By being open-source, Falaqui allows users to verify the security and privacy of the application themselves.

### Goals
- Provide a secure and private messaging platform.
- Offer an open-source alternative to popular chat apps.
- Support both personal and corporate communication needs.

## Features

- **Instant Messaging**: Send and receive text messages instantly.
- **Audio Transcription**: Send and receive audio messages with automatic transcription.
- **Media Sharing**: Share photos and images securely.
- **Contact Integration**: Find contacts directly from your phonebook.
- **Group Communication**: Create and manage groups for personal or corporate use.
- **Corporate Features**: Set date and time restrictions for corporate group access.

## Screenshots

| Splashscreen | Login Screen | Login with Localized Phone Number |
|--------------|--------------|-----------------------------------|
| ![Splashscreen](docs/img/falaqui-open-splash.png "Splashscreen") | ![Login Screen](docs/img/falaqui-open-login.png "Login Screen") | ![Login with Localized Phone Number](docs/img/falaqui-open-login-w-local-phone.png "Login with Localized Phone Number") |

| Home Screen | Chat Screen | Chat Screen with Media |
|-------------|-------------|------------------------|
| ![Home Screen](docs/img/falaqui-open-home.png "Home Screen") | ![Chat Screen](docs/img/falaqui-open-chat.png "Chat Screen") | ![Chat Screen with Media](docs/img/falaqui-open-chat-w-media.png "Chat Screen with Media") |

| Home Screen with Notification | Group Create/Edit Screen | Company Setup Screen | Account Settings Screen |
|-------------------------------|--------------------------|----------------------|-------------------------|
| ![Home Screen with Notification](docs/img/falaqui-open-home-w-notification.png "Home Screen with Notification") | ![Group Create/Edit Screen](docs/img/falaqui-open-group-create-edit.png "Group Create/Edit Screen") | ![Company Setup Screen](docs/img/falaqui-open-company.png "Company Setup Screen") | ![Account Settings Screen](docs/img/falaqui-open-account.png "Account Settings Screen") |

## Tech Stack

### Backend
- **Node.JS** with **Express**
- **Websocket Server** for individual and group chat
- **Redis** for caching server information
- **Whisper** for server-side audio transcription

### Database
- **MySQL Server**

### Push Notification
- **Firebase Cloud Messaging** (Android and iOS)

### Frontend
- **Apache Cordova**
- **JavaScript**
- **MaterializeCSS**
- **Pug** (HTML Pre-processor)

### Apache Cordova Plugins
- **Swift** and **ObjectiveC** for iOS
- **Java** for Android
- **C/C++** for iOS and Android
- **WhisperCPP** for client-side audio transcription (offline transcription)

## Installation

### Get Started and Run

This section is currently under construction. Please check back later for detailed instructions on how to set up and run Falaqui locally.

#### Requirements
- Node.JS
- MySQL Server
- Redis
- Firebase Cloud Messaging

#### Instructions
Coming soon...

#### Note
Important information for setting up the application on your local machine will be provided here.

## License

Falaqui is licensed under the **AGPL-3.0 License**. This license allows you to:
- Use the software for any purpose.
- Modify and distribute the software.
- Use the software commercially.

However, any modifications or distributions must also be licensed under the AGPL-3.0 License, and the source code must be made available to users.

## Acknowledgments

- **Node.JS** and **Express** for the backend server.
- **Whisper** for audio transcription.
- **Apache Cordova** for the frontend app.
- **Firebase Cloud Messaging** for push notifications.

## Official App Stores

- **Apple Store**: [Download on the App Store](https://apps.apple.com/us/app/falaqui/id6503642039)
- **Google Play**: [Get it on Google Play](https://play.google.com/store/apps/details?id=com.br.falaqui)
- **Samsung Galaxy**: [Download on Samsung Galaxy Store](https://galaxystore.samsung.com/detail/com.br.falaqui)

## Official WebSites

- **Main: Portuguese (pt-BR)**: [Visit](https://FalaQui.com.br)
- **English Version**: [Visit](https://FalaQui.com)
- **Org Version (pt-BR)**: [Visit](https://FalaQui.org)

---

**Falaqui** - Your private, secure, and open-source chat solution.
