# Contributing to Council of Minds

First off, thank you for considering contributing to Council of Minds! It's people like you that make open-source software such a great community to learn, inspire, and create.

This document provides guidelines and instructions for contributing to this project. We want to make your contribution experience as smooth and enjoyable as possible.

## Table of Contents
1. [Core Philosophy (Please Read First!)](#core-philosophy-please-read-first)
2. [Code of Conduct](#code-of-conduct)
3. [Suggestions, Feedback, & Bugs](#suggestions-feedback--bugs)
4. [Getting Started](#getting-started)
5. [Development Workflow](#development-workflow)
6. [Pull Request Process](#pull-request-process)

---

## Core Philosophy (Please Read First!)

Before diving into code, it's vital to understand the architectural constraints of Council of Minds. We adhere to strict **Bring-Your-Own-Key (BYOK)** and **local-first** principles to guarantee user privacy:

- **No External Databases**: All persistent user data (chats, personas, settings) must be stored locally in the user's browser using IndexedDB (via Dexie).
- **Stateless Backend**: The Next.js API routes act purely as a stateless proxy to the LLM providers (to avoid CORS issues). They must **never** log, store, or persist user API keys or chat content.
- **No Authentication**: Do not introduce any authentication providers (e.g., NextAuth, Clerk, Supabase). The app should remain accessible immediately upon opening.

> [!WARNING]
> Any pull request that introduces external state, logging of sensitive data, or server-side databases will not be accepted.

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming and respectful environment for everyone. Please be kind, collaborative, and constructive in your interactions.

## Suggestions, Feedback, & Bugs

We love hearing your ideas! If you want to suggest a new feature, report a bug, or propose an architectural change:

- **Bug Reports & Technical Features:** Please [open an Issue](https://github.com/chirag-panjabi/council-of-minds-v2/issues) on GitHub. Provide as much detail as possible to help us reproduce the issue or understand the feature request.
- **Discussions & Feedback:** Start a thread in [GitHub Discussions](https://github.com/chirag-panjabi/council-of-minds-v2/discussions) (if enabled) to discuss major changes before writing any code.
- **Community & Personas:** Join us on our [Reddit Community (r/CouncilOfMinds)](https://www.reddit.com/r/CouncilOfMinds/) to share your custom personas, chat about AI, and get community feedback.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher is recommended)
- `npm` (comes with Node.js)

### Installation

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/council-of-minds-v2.git
   cd council-of-minds-v2
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the application in your browser.

## Development Workflow

1. **Create a branch** for your feature or bugfix. Use a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Make your changes** in the codebase.
3. **Ensure quality**: Run linting and type checking before committing to catch errors early.
   ```bash
   npm run typecheck
   npm run lint
   ```
4. **Write tests**: If you are adding a new feature or fixing a complex bug, please add unit tests (Vitest) or end-to-end tests (Playwright) as appropriate.
   ```bash
   npm run test      # Run unit tests
   npm run test:e2e  # Run e2e tests
   ```
5. **Commit your changes**: Write clear, concise commit messages. We prefer [Conventional Commits](https://www.conventionalcommits.org/) format.
   ```bash
   git commit -m "feat: add ability to export personas as json"
   ```

## Pull Request Process

1. **Push your branch** to your fork on GitHub.
2. **Open a Pull Request** against the `main` branch of this repository.
3. **Describe your changes** in detail in the PR description. Explain *what* you changed and *why*.
4. **Wait for review**. A maintainer will review your code. We may suggest some changes or improvements before merging.

Thank you for contributing to Council of Minds! Your efforts help make this tool better for everyone.
