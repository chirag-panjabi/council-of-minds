# Contributing to Council of Minds

First off, thank you for considering contributing to Council of Minds! It's people like you that make open-source software such a great community to learn, inspire, and create.

This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming and respectful environment for everyone.

## Getting Started

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
   Open `http://localhost:3000` to view the application.

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes in the codebase.
3. **Ensure quality**: Run linting and type checking before committing.
   ```bash
   npm run typecheck
   npm run lint
   ```
4. **Write tests**: If you are adding a new feature, please write unit tests (Vitest) or end-to-end tests (Playwright) as appropriate.
   ```bash
   # Run unit tests
   npm run test
   
   # Run e2e tests
   npm run test:e2e
   ```
5. **Commit your changes**: Write clear, concise commit messages.
   ```bash
   git commit -m "feat: description of your feature"
   ```

## Suggestions & Bug Reports

If you want to suggest a new feature, report a bug, or propose an architectural change, please **open an Issue** or start a thread in **GitHub Discussions** first. We highly encourage discussing major changes before writing any code to ensure it aligns with the project's vision.

## Pull Request Process

1. Push your branch to your fork on GitHub.
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Describe your changes in detail in the PR description.
4. Wait for a maintainer to review your code. We may suggest some changes or improvements before merging.

## Architectural Constraints (BYOK)

Council of Minds adheres to strict Bring-Your-Own-Key (BYOK) and local-first constraints:
- **No external databases**: All persistent user data (chats, personas, settings) must be stored in the browser using IndexedDB (Dexie).
- **Stateless proxy**: The Next.js API routes act purely as a stateless proxy to the LLM providers to avoid CORS issues. They must never log, store, or persist user API keys or chat content.
- **No authentication**: Do not introduce NextAuth, Clerk, Supabase, etc.

Any pull request that violates these core privacy and architectural constraints will not be accepted.

Thank you for contributing!
