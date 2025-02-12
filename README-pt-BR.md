# Falaqui - Aplicativo de Chat de Código Aberto

<img src="docs/img/falaqui-open-banner.png" alt="Banner do Falaqui" />

**Falaqui** é um aplicativo de chat simples, privado e seguro, projetado para uso pessoal e corporativo. Com criptografia de ponta a ponta, acesso a mensagens offline e suporte para texto, mídia, transcrições de áudio e muito mais, o Falaqui pretende ser uma alternativa de código aberto a aplicativos de chat populares como WhatsApp e Telegram.

*This article can also be read in [English](README.md).*

## Índice
- [Sobre](#sobre)
- [Recursos](#recursos)
- [Capturas de Tela](#capturas-de-tela)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação](#instalação)
- [Licença](#licença)

## Sobre

<img src="docs/img/falaqui-open-icon.png" alt="Logo do Falaqui" width="200" />
O Falaqui é um aplicativo de chat de código aberto que prioriza a privacidade e a segurança. Ele permite que os usuários enviem mensagens, compartilhem arquivos e se comuniquem em grupos com criptografia de ponta a ponta. Quer você esteja conversando com amigos, familiares ou colegas de trabalho, o Falaqui garante que suas conversas permaneçam privadas e seguras.

### Motivação
A motivação por trás do Falaqui é fornecer uma alternativa transparente e segura aos aplicativos de chat de código fechado que podem coletar ou reter dados sensíveis dos usuários. Por ser de código aberto, o Falaqui permite que os usuários verifiquem a segurança e a privacidade do aplicativo por si mesmos.

### Objetivos
- Fornecer uma plataforma de mensagens segura e privada.
- Oferecer uma alternativa de código aberto aos aplicativos de chat populares.
- Suportar necessidades de comunicação pessoais e corporativas.

## Recursos

- **Mensagens Instantâneas**: Envie e receba mensagens de texto instantaneamente.
- **Transcrição de Áudio**: Envie e receba mensagens de áudio com transcrição automática.
- **Compartilhamento de Mídia**: Compartilhe fotos e imagens com segurança.
- **Integração de Contatos**: Encontre contatos diretamente da sua lista telefônica.
- **Comunicação em Grupo**: Crie e gerencie grupos para uso pessoal ou corporativo.
- **Recursos Corporativos**: Defina restrições de data e hora para acesso a grupos corporativos.

## Capturas de Tela

| Tela Inicial | Tela de Login | Login com Número de Telefone Localizado |
|--------------|--------------|-----------------------------------------|
| ![Tela Inicial](docs/img/falaqui-open-splash.png "Tela Inicial") | ![Tela de Login](docs/img/falaqui-open-login.png "Tela de Login") | ![Login com Número de Telefone Localizado](docs/img/falaqui-open-login-w-local-phone.png "Login com Número de Telefone Localizado") |

| Tela Principal | Tela de Chat | Tela de Chat com Mídia |
|----------------|--------------|------------------------|
| ![Tela Principal](docs/img/falaqui-open-home.png "Tela Principal") | ![Tela de Chat](docs/img/falaqui-open-chat.png "Tela de Chat") | ![Tela de Chat com Mídia](docs/img/falaqui-open-chat-w-media.png "Tela de Chat com Mídia") |

| Tela Principal com Notificação | Tela de Criação/Edição de Grupo | Tela de Configuração da Empresa | Tela de Configurações da Conta |
|--------------------------------|--------------------------------|--------------------------------|--------------------------------|
| ![Tela Principal com Notificação](docs/img/falaqui-open-home-w-notification.png "Tela Principal com Notificação") | ![Tela de Criação/Edição de Grupo](docs/img/falaqui-open-group-create-edit.png "Tela de Criação/Edição de Grupo") | ![Tela de Configuração da Empresa](docs/img/falaqui-open-company.png "Tela de Configuração da Empresa") | ![Tela de Configurações da Conta](docs/img/falaqui-open-account.png "Tela de Configurações da Conta") |

## Tecnologias Utilizadas

### Backend
- **Node.JS** com **Express**
- **Servidor Websocket** para chat individual e em grupo
- **Redis** para cache de informações do servidor
- **Whisper** para transcrição de áudio no servidor

### Banco de Dados
- **Servidor MySQL**

### Notificações Push
- **Firebase Cloud Messaging** (Android e iOS)

### Frontend
- **Apache Cordova**
- **JavaScript**
- **MaterializeCSS**
- **Pug** (Pré-processador HTML)

### Plugins do Apache Cordova
- **Swift** e **ObjectiveC** para iOS
- **Java** para Android
- **C/C++** para iOS e Android
- **WhisperCPP** para transcrição de áudio no cliente (transcrição offline)

## Instalação

### Comece e Execute

Esta seção está atualmente em construção. Por favor, volte mais tarde para obter instruções detalhadas sobre como configurar e executar o Falaqui localmente.

#### 1. Requisitos

É necessário um conjunto de instalação e configuração, tais como:
- Node.JS
- Servidor MySQL
- Redis
- Firebase Cloud Messaging
- C/C++ Build Environment
- \+ um conjunto de pacotes de apoio

Siga a seguir as instruções para começar a configurar o seu ambiente.

##### Requisitos de Configuração do Servidor

Escolha a plataforma no qual deseja montar seu ambiente e siga as instruções conforme o link relacionado.

| Plataforma             | Instruções                                   |
|------------------------|---------------------------------------------|
| **Linux Ubuntu**       | [Guia de Configuração de Requisitos do Linux Ubuntu (em inglês)](docs/platforms/linux-ubuntu/requirements/README.md) |
| **MacOS Apple Silicon** | [Guia de Configuração de Requisitos do MacOS (em inglês)](docs/platforms/mac/requirements/README.md) |
| **Windows**            | [Guia de Configuração de Requisitos do Windows (em inglês)](docs/platforms/win/requirements/README.md) |

*Observação: Essas instruções podem ser adaptadas para outras plataformas além das listadas acima.*

#### 2. Configuração do Servidor
Faça o download ou clone a versão mais recente do código.

##### 2.1 Inicialização do Servidor de Desenvolvimento
Para fins de desenvolvimento, você pode simplesmente executar:
```bash
node server.js
```

##### 2.2 Inicialização do Servidor de Produção (Daemon)
Para executar o servidor em segundo plano (daemon) com NODE_ENV em "modo de produção", use o comando PM2:
```bash
pm2 start start-flq-server-ecosystem.json --env production
```
*Nota: O arquivo de ecossistema start-flq-server-ecosystem.json contém a configuração do ambiente para produção.*

Para facilitar os usuários de MacOS e Linux, há o script shell start-flq-server.sh que pode ser usado para iniciar o processo.
```bash
./start-flq-server.sh
```

Para saber mais sobre o PM2 e seus comandos, consulte a documentação do PM2 em https://pm2.keymetrics.io/docs/usage/process-management.


### Requisitos para a Construção do App para Telefone
A construção do aplicativo utiliza um arquivo de configuração para definir as variáveis de ambiente para o processo de construção. A construção é feita por um script automatizado que lê o arquivo de configuração e define os valores para o processo de construção.

A construção do aplicativo móvel é feita para funcionar no Linux Ubuntu e MacOS. A plataforma Windows ainda não foi testada e pode não funcionar.

#### 1. Instale as Ferramentas de Desenvolvimento

- **Servidor Falaqui**: O Servidor Falaqui deve estar em execução no ambiente de desenvolvimento ou em um servidor acessível pela internet. O Servidor Falaqui é o backend do Aplicativo Falaqui e é responsável pelo chat, autenticação de usuários e outros recursos. Siga as instruções na seção [Configuração do Servidor](#server-setup) para configurar o Servidor Falaqui.

- **XCode**: Para construções iOS (somente MacOS). Baixe na App Store: [XCode](https://apps.apple.com/us/app/xcode/id497799835)

- **Android Studio**: Para construções Android. Baixe no site oficial: [Android Studio](https://developer.android.com/studio) e defina o caminho do Android SDK na variável de ambiente ANDROID_HOME e na variável obsoleta ANDROID_SDK_ROOT.

- **Versão Estável do Android SDK**: A versão estável mais recente deve ser instalada com o Android Studio. Mas, se você precisar de uma versão diferente, você pode usar o seguinte comando:

Exemplo para instalar o Android SDK no Ubuntu:
```bash
sudo snap install androidsdk
```

Exemplo para instalar o Android SDK no MacOS:
```bash
brew install androidsdk
```

Exemplo para definir a versão do Android SDK 34.0.0:
```bash
androidsdk "platform-tools" "tools" "build-tools;34.0.0" "platforms;android-34"
```

- **Java Development Kit (JDK)**: Para construções Android. Baixe no site da Oracle uma versão correta do Java e defina o caminho do JDK na variável de ambiente JAVA_HOME. No momento desta documentação, a versão mais recente do JDK para melhor uso em projetos Cordova é o Java 17.

Exemplo para instalar o Java 17 no Ubuntu:
```bash
sudo apt install openjdk-17-jdk
```

Exemplo para instalar o Java 17 no MacOS:
```bash
brew install openjdk@17
```

Se você estiver trabalhando com múltiplas versões do JDK no seu Linux Ubuntu, você pode definir a versão do JDK usando o seguinte comando:
```bash
sudo update-alternatives --config java
```

- **Node.JS**: Use a versão 23 ou superior. Baixe no site oficial: [Node.JS](https://nodejs.org/en/download/) ou use o seguinte comando para instalar a versão mais recente:

Para Linux Ubuntu:
```bash
curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
```

Para MacOS:
```bash
brew install node
```

- **Gradle**: Deve ser instalado com o Android Studio. Mas, se você tiver algum problema com a indisponibilidade do Gradle, você pode instalá-lo separadamente. Baixe no site oficial: [Gradle](https://gradle.org/install/) e defina o caminho do Gradle na variável de ambiente GRADLE_HOME.
Certifique-se de usar a versão compatível do Gradle com a versão do JDK. Verifique o site: [Compatibilidade do Gradle](https://docs.gradle.org/current/userguide/compatibility.html)
Exemplo para JDK 17, você pode tentar usar o Gradle 7.2, mas alguns ambientes funcionam melhor com o Gradle 8.7.

- **Variáveis de Ambiente**: As variáveis de ambiente após todas as instalações devem ser definidas da seguinte forma:
    - **ANDROID_HOME**: Caminho do Android SDK.
    - **ANDROID_SDK_ROOT**: Caminho do Android SDK.
    - **JAVA_HOME**: Caminho do JDK.
    - **GRADLE_HOME**: Caminho do Gradle.

#### 2. Crie o Arquivo de Configuração

Crie o arquivo setup-cordova-build.cfg com base no arquivo setup-cordova-build.cfg-template e defina os valores de acordo com o seu ambiente.

Valores importantes de produção a serem definidos:
- **SERVERENDPOINT**: O endpoint do servidor (backend) é o endereço de domínio HTTPS apontando para o servidor onde o backend está em execução. IMPORTANTE: O endereço deve ser https com um certificado SSL válido.
- **SOCKETENDPOINT**: O endpoint do socket é o endereço de domínio WSS apontando para o servidor onde o backend está em execução. IMPORTANTE: O endereço deve ser wss com um certificado SSL válido.
- **CONFIGHOSTNAME**: O hostname de configuração é o endereço de domínio apontando para o servidor onde o backend está em execução.
- **GOOGLETAGMANAGER**: Google Tag Manager, se disponível.
- **BUNDLEIDMARKET**: O Bundle ID market é a parte do seu Bundle ID que identifica o mercado onde o aplicativo está sendo publicado. Por exemplo, se o seu Bundle ID é com.mydomain.myapp, o BUNDLEIDMARKET é mydomain.
- **JSOBFUSCATOR**: Ofuscador de JavaScript (true ou false).
- **SAMSUNGGALAXYSTOREBUILD**: A construção para a Samsung Galaxy Store é a flag para indicar se a construção é para a Samsung Galaxy Store (0 para false ou 1 para true).
- **CAMERA_USAGE_REASON**: Motivo de uso da câmera para informar à loja de aplicativos.
- **PHOTO_LIBRAY_USAGE_REASON**: Motivo de uso da biblioteca de fotos para informar à loja de aplicativos.
- **CONTACT_LIST_USAGE_REASON**: Motivo de uso da lista de contatos para informar à loja de aplicativos.
- **MICROPHONE_USAGE_REASON**: Motivo de uso do microfone para informar à loja de aplicativos.

Outros valores a serem definidos:
- **THEME_COLOR**: Cor do tema.
- **DEFAULT_THEME**: Tema padrão.
- **ANDROIDSPLASHSCREENMODE**: Modo da tela de splash do Android.
- **SPLASHBACKGROUNDCOLOR**: Cor de fundo da tela de splash.
- **SPLASHICONSVGBACKGROUNDCOLOR**: Cor de fundo do ícone SVG da tela de splash.
- **SPLASHICONSVGSTROKECOLOR**: Cor do traço do ícone SVG da tela de splash.
- **KEYWORDS**: Palavras-chave para o aplicativo.
- **SPLASHSCREENDELAY**: Atraso da tela de splash.
- **FADESPLASHSCREENDURATION**: Duração do fade da tela de splash.
- **USEINTERNALSPLASHSCREEN**: Usar tela de splash interna.
- **APPWEBSITE**: Site do aplicativo, se disponível.
- **PRODUCTVERSION**: Versão do produto para uso interno. Não é a versão do aplicativo.

Exemplo:
```
CAMERA_USAGE_REASON="Precisamos de acesso à sua câmera para que possamos enviar documentos com fotos ou identificar seu perfil."
PHOTO_LIBRAY_USAGE_REASON="Precisamos de acesso à sua biblioteca de fotos para que possamos enviar documentos com fotos ou identificar seu perfil."
CONTACT_LIST_USAGE_REASON="Precisamos de acesso à lista de contatos do seu dispositivo para facilitar sua interação com credores e beneficiários."
MICROPHONE_USAGE_REASON="Precisamos de acesso ao microfone para gravar sons."
THEME_COLOR="#157fcc"
DEFAULT_THEME="dark" # dark | light
ANDROIDSPLASHSCREENMODE="image" # xml | image
SPLASHBACKGROUNDCOLOR="#CF240A"
SPLASHICONSVGBACKGROUNDCOLOR="#CF240A"
SPLASHICONSVGSTROKECOLOR="#CF240A"
KEYWORDS="falaqui, chat social, p2p, conversa, chat, social, rede social, mídia social, aplicativo social, plataforma social, aplicativo de rede social, plataforma de rede social, aplicativo de mídia social, plataforma de mídia social, aplicativo de chat social, plataforma de chat social, rede de chat social, aplicativo de rede de chat social, plataforma de rede de chat social, mídia de chat social, aplicativo de mídia de chat social, plataforma de mídia de chat social, conversa de chat social, aplicativo de conversa de chat social, plataforma de conversa de chat social, chat social p2p, aplicativo de chat social p2p, plataforma de chat social p2p, rede de chat social p2p, aplicativo de rede de chat social p2p, plataforma de rede de chat social p2p, mídia de chat social p2p, aplicativo de mídia de chat social p2p, plataforma de mídia de chat social p2p, conversa de chat social p2p"
SPLASHSCREENDELAY="50"
FADESPLASHSCREENDURATION="100"
USEINTERNALSPLASHSCREEN="0"
APPWEBSITE="https://app.mydomain.com"
PRODUCTVERSION="1.0"
SERVERENDPOINT="https://flq.mydomain.com/"
SOCKETENDPOINT="wss://flqwss.mydomain.com:24013"
CONFIGHOSTNAME="flq.mydomain.com"
GOOGLETAGMANAGER="GTM-XXXXXXXX"
BUNDLEIDMARKET="world"
JSOBFUSCATOR=false
SAMSUNGGALAXYSTOREBUILD="0"
```

#### 3. Monte o Ambiente do Seu Aplicativo (Script de Configuração)
O script de configuração é um script shell que monta o ambiente para a construção do aplicativo. Ele define as variáveis de ambiente e instala os pacotes necessários para o processo de construção.

Para executar o script de configuração, você deve fornecer a seguinte sequência de parâmetros:
- **Nome do Aplicativo**: O nome do aplicativo em letras minúsculas sem espaços. Exemplo: falaqui
- **Nome do Projeto do Aplicativo**: O nome do projeto do aplicativo. Exemplos: Falaqui ou "Aplicativo Falaqui"
- **Plataforma do Aplicativo**: A plataforma para a construção do aplicativo. Exemplos: android, ios, browser ou electron. IMPORTANTE: A plataforma electron ainda não foi testada e pode não funcionar.
- **Versão do Aplicativo**: A versão do aplicativo. Exemplo: 1.0.0

Exemplo para construir para a plataforma Browser:
```bash
./setup-cordova.sh "falaqui" "FalaQui" "browser" "1.0.0"
```

Exemplo para construir para a plataforma Android:
```bash
./setup-cordova.sh "falaqui" "FalaQui" "android" "1.0.0"
```

Exemplo para construir para a plataforma iOS (requer MacOS e XCode):
```bash
./setup-cordova.sh "falaqui" "FalaQui" "ios" "1.0.0"
```

Após executar o script de configuração, um projeto Cordova será criado no diretório app_build_CHOSEN_PLATFORM/APPNAME. Exemplo de configuração de projeto Cordova: app_build_android/falaqui.
Você também pode usar os comandos da CLI do Cordova no diretório app_build_CHOSEN_PLATFORM/APPNAME para construir o aplicativo para a plataforma escolhida.

### Construção do Aplicativo Móvel
Toda alteração no código do aplicativo deve ser seguida por um novo processo de construção. O processo de construção é feito por um script automatizado que lê o arquivo de configuração e define os valores para o processo de construção.

Semelhante ao script de configuração, o script de construção é um script shell que constrói o aplicativo para a plataforma escolhida. Ele define as variáveis de ambiente e instala os pacotes necessários para o processo de construção.

Exemplo para construir para a plataforma Browser:
```bash
./setup-cordova-build.sh "falaqui" "FalaQui" "browser" "1.0.0"
```

Exemplo para construir para a plataforma Android:
```bash
./setup-cordova-build.sh "falaqui" "FalaQui" "android" "1.0.0"
```

Exemplo para construir para a plataforma iOS (requer MacOS e XCode):
```bash
./setup-cordova-build.sh "falaqui" "FalaQui" "ios" "1.0.0"
```

Após executar o script de construção, o aplicativo será construído no diretório app_build_CHOSEN_PLATFORM/APPNAME. Exemplo de construção de projeto Cordova: app_build_android/falaqui.

### Executando o Aplicativo

Você pode usar os comandos da CLI do Cordova no diretório app_build_CHOSEN_PLATFORM/APPNAME para executar o aplicativo para a plataforma escolhida.

IMPORTANTE: Para uma visualização rápida do desenvolvimento, você pode usar a plataforma Browser. Para uma visualização mais realista, você pode usar as plataformas Android e iOS. Alguns recursos como Agenda, Microfone, Câmera e Transcrição de Áudio podem não funcionar na plataforma Browser.

#### Plataforma Browser
Para executar o aplicativo na plataforma Browser, use o seguinte comando:
```bash
cd app_build_browser/falaqui
cordova run browser
```
IMPORTANTE: Para melhor desempenho, use um navegador baseado no projeto Chrome, como Google Chrome, Chromium, Brave, etc.

#### Plataforma Android
Você pode usar o Android Studio para executar o aplicativo na plataforma Android. Abra o Android Studio e selecione para abrir o diretório app_build_android/falaqui/platforms/android. Após o projeto ser carregado, você pode executar o aplicativo no Android Emulator ou em um dispositivo Android conectado. Essa é a maneira recomendada para executar o aplicativo na plataforma Android, especialmente para depuração e teste para visualizar os logs do Logcat.
O Android Studio também é a maneira recomendada para publicar o aplicativo na Google Play Store.

Também é possível executar o comando no terminal para executar o aplicativo na plataforma Android. Use o seguinte comando:
```bash
cd app_build_android/falaqui
cordova run android
```


## Licença

O Falaqui é licenciado sob a **Licença AGPL-3.0**. Esta licença permite que você:
- Use o software para qualquer finalidade.
- Modifique e distribua o software.
- Use o software comercialmente.

No entanto, quaisquer modificações ou distribuições também devem ser licenciadas sob a Licença AGPL-3.0, e o código-fonte deve ser disponibilizado aos usuários.

## Lojas de Aplicativos Oficiais

- **Apple Store**: [Baixe na App Store](https://apps.apple.com/us/app/falaqui/id6503642039)
- **Google Play**: [Disponível no Google Play](https://play.google.com/store/apps/details?id=com.br.falaqui)
- **Samsung Galaxy**: [Baixe na Samsung Galaxy Store](https://galaxystore.samsung.com/detail/com.br.falaqui)

## WebSites Oficiais

- **Principal: Português (pt-BR)**: [Visit](https://FalaQui.com.br)
- **Versão em Inglês**: [Visit](https://FalaQui.com)
- **Versão Org (pt-BR)**: [Visit](https://FalaQui.org)

---

**Falaqui** - Sua solução de chat privada, segura e de código aberto.
