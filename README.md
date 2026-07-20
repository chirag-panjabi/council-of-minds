# Council of Minds

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Council of Minds is a local-first, Bring-Your-Own-Key (BYOK) workspace for structured 1-on-1 and sequential multi-persona AI conversations. It runs entirely in your browser, keeping your data and API keys secure and local.

## 🛠 Built With

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **UI & Styling:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Local Storage:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Testing:** [Vitest](https://vitest.dev/) (Unit), [Playwright](https://playwright.dev/) (E2E)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/chirag-panjabi/council-of-minds.git
cd council-of-minds
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The app relies on IndexedDB for local storage, so there is no external database to configure.

## ⚙️ Usage & Setup

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

## 🌐 Community

Join our community on Reddit at [r/CouncilOfMinds](https://www.reddit.com/r/CouncilOfMinds)! 
It's the perfect place to:
- **Share Personas:** Export your custom AI personas (as Base64 strings) and import others.
- **Exchange Rosters:** Discuss the best combinations of personas to tackle specific problems.
- **Learn:** Share tips on prompt engineering and local model configurations.

## 💬 Feedback & Suggestions

Have a feature idea, suggestion, or found a bug? We'd love to hear from you!
Please open an [Issue](https://github.com/chirag-panjabi/council-of-minds/issues) or start a conversation in [GitHub Discussions](https://github.com/chirag-panjabi/council-of-minds/discussions).

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct, the development workflow, and the strict BYOK architectural constraints you must follow before submitting a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

For detailed requirements, data contracts, and architecture decisions, please refer to our internal documentation:
- [Target Product Scope](./docs/PRODUCT_SCOPE.md)
- [Target Architecture](./docs/ARCHITECTURE.md)
- [Privacy, Security, and Safety Contract](./docs/PRIVACY_AND_SAFETY.md)
- [MVP Acceptance Checklist](./docs/MVP_ACCEPTANCE.md)
- [Internal Project Status](./docs/INTERNAL_README.md)
