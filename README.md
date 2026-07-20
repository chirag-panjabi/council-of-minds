# Council of Minds

Council of Minds is a local-first, Bring-Your-Own-Key (BYOK) workspace for structured 1-on-1 and sequential multi-persona AI conversations. It runs entirely in your browser, keeping your data and API keys secure and local.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/chirag-panjabi/council-of-minds-v2.git
cd council-of-minds-v2
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The app relies on IndexedDB for local storage, so there is no external database to configure.

## 🛠 Usage & Setup

### Bring Your Own Key (BYOK)
Council of Minds is completely stateless. It does not store your API keys on any external server. 
1. Open the app at `http://localhost:3000`.
2. Navigate to **Settings** (usually via the bottom left gear icon).
3. Under the **Providers** section, enter your API keys for OpenAI, Anthropic, or Google Gemini.
4. Keys are securely stored in your browser's local storage and used directly for requests.

### Local Models (Ollama)
If you prefer running local models, you can connect to your local Ollama instance:
1. Ensure Ollama is running on your machine (usually at `http://localhost:11434`).
2. In the app Settings, configure the Ollama provider URL.
3. The app will connect directly to your local loopback server without touching the internet.

## 🎯 Target MVP Features

- **Multi-Provider Support:** OpenAI, Anthropic, and Google Gemini through a same-origin stateless proxy.
- **Local Models:** Ollama integration through a direct browser-to-localhost connection.
- **Rich Chat Features:** Local personas, 1-on-1 chat, sequential Council chat, versioned backup/restore, search, and local analytics.
- **Purely Client-Side:** No user accounts, no hosted marketplace, no billing, no cloud sync, no remote database, and no remote code execution.

## 🔒 Privacy Summary

Durable application data belongs in the browser. Cloud requests, including their required API keys and submitted content, transit the stateless proxy and selected provider; the proxy must not persist or log them. Local Ollama requests go directly to the configured loopback server.

## 📚 Documentation

For detailed requirements, data contracts, and architecture decisions, please refer to our internal documentation:
- [Target Product Scope](./docs/PRODUCT_SCOPE.md)
- [Target Architecture](./docs/ARCHITECTURE.md)
- [Privacy, Security, and Safety Contract](./docs/PRIVACY_AND_SAFETY.md)
- [MVP Acceptance Checklist](./docs/MVP_ACCEPTANCE.md)
- [Internal Project Status](./docs/INTERNAL_README.md)
