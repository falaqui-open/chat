# Falaqui - Aplicativo de Chat de Código Aberto

<img src="https://i.imghippo.com/files/Kl7316SO.png" alt="Banner do Falaqui" />

**Falaqui** é um aplicativo de chat simples, privado e seguro, projetado para uso pessoal e corporativo. Com criptografia de ponta a ponta, acesso a mensagens offline e suporte para texto, mídia, transcrições de áudio e muito mais, o Falaqui pretende ser uma alternativa de código aberto a aplicativos de chat populares como WhatsApp e Telegram.

*This article can also be read in [English](README.md).*

## Índice
- [Sobre](#sobre)
- [Recursos](#recursos)
- [Capturas de Tela](#capturas-de-tela)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação](#instalação)
- [Licença](#licença)
- [Agradecimentos](#agradecimentos)

## Sobre

<img src="https://i.imghippo.com/files/xXE4574NQM.png" alt="Logo do Falaqui" width="200" />
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
| ![Tela Inicial](https://i.imghippo.com/files/ki3556f.png "Tela Inicial") | ![Tela de Login](https://i.imghippo.com/files/pCK7015Ghg.png "Tela de Login") | ![Login com Número de Telefone Localizado](https://i.imghippo.com/files/QP4314DAk.png "Login com Número de Telefone Localizado") |

| Tela Principal | Tela de Chat | Tela de Chat com Mídia |
|----------------|--------------|------------------------|
| ![Tela Principal](https://i.imghippo.com/files/uAl3835KeM.png "Tela Principal") | ![Tela de Chat](https://i.imghippo.com/files/GH7747idQ.png "Tela de Chat") | ![Tela de Chat com Mídia](https://i.imghippo.com/files/rDaK2088apc.png "Tela de Chat com Mídia") |

| Tela Principal com Notificação | Tela de Criação/Edição de Grupo | Tela de Configuração da Empresa | Tela de Configurações da Conta |
|--------------------------------|--------------------------------|--------------------------------|--------------------------------|
| ![Tela Principal com Notificação](https://i.imghippo.com/files/miV1491LM.png "Tela Principal com Notificação") | ![Tela de Criação/Edição de Grupo](https://i.imghippo.com/files/UJYV6583SBY.png "Tela de Criação/Edição de Grupo") | ![Tela de Configuração da Empresa](https://i.imghippo.com/files/Ztz6424yM.png "Tela de Configuração da Empresa") | ![Tela de Configurações da Conta](https://i.imghippo.com/files/KeT5358Zoo.png "Tela de Configurações da Conta") |

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

#### Requisitos
- Node.JS
- Servidor MySQL
- Redis
- Firebase Cloud Messaging

#### Instruções
Em breve...

#### Nota
Informações importantes para configurar o aplicativo em sua máquina local serão fornecidas aqui.

## Licença

O Falaqui é licenciado sob a **Licença AGPL-3.0**. Esta licença permite que você:
- Use o software para qualquer finalidade.
- Modifique e distribua o software.
- Use o software comercialmente.

No entanto, quaisquer modificações ou distribuições também devem ser licenciadas sob a Licença AGPL-3.0, e o código-fonte deve ser disponibilizado aos usuários.

## Agradecimentos

- **Node.JS** e **Express** pelo servidor backend.
- **Whisper** pela transcrição de áudio.
- **Apache Cordova** pelo aplicativo frontend.
- **Firebase Cloud Messaging** pelas notificações push.

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
