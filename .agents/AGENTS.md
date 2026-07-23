# Regular Git Commits
When completing a logical block of work (e.g., implementing a new feature, finishing a refactor, or resolving a bug), you must proactively commit the changes using `git` to ensure proper versioning and prevent data loss. 
- Ensure all relevant files are staged. **Do not use blanket commands like `git add .` or `git add -A` if it risks staging unnecessary files.**
- Only stage the specific files that are required for the current task.
- **CRITICAL:** If there are other modified or untracked files in the directory that you are deliberately skipping, you MUST inform the user about these skipped files in your response. The user will then decide whether to add them.
- Write proper, descriptive commit messages. Use conventional commits if applicable (e.g., `feat(frontend): description`, `fix(backend): description`, `refactor(api): description`). 
- Do not leave large amounts of unstaged or uncommitted work in the repository between major tasks.

# Always Plan Feature Implementations
Regardless of how trivial a feature request may seem, you must ALWAYS write an implementation plan (`implementation_plan.md`) and wait for the user's explicit approval before modifying any code. Do not bypass planning mode for any feature additions or modifications.

# BYOK Open-Source Architecture Constraints
When writing code for this project, you must adhere to the following constraints to maintain the Open-Source Bring Your Own Key (BYOK) architecture:
- **Client-Side Storage Only:** Store all user state (chat history, API keys, settings) exclusively in browser `localStorage` or `IndexedDB`.
- **Stateless Backend:** The backend must remain completely stateless. Do not introduce any server-side database connections (PostgreSQL, MongoDB, Prisma) for storing user data.
- **No Authentication:** Do not implement NextAuth, Clerk, Supabase Auth, or any login screens.
- **No Billing Logic:** Do not add Stripe, payment gateways, or backend credit-deduction logic.
- **Secure Key Handling:** The backend must never log, print, or persist the user's API key. It must only exist in memory during the request proxy.

# Hallmark Skill Enforced for All UI Decisions
- Everything related to UI design, aesthetics, component structure, typography, microinteractions, and visual layouts MUST be governed by the `hallmark` skill (`/Users/chirag/.gemini/config/skills/hallmark/SKILL.md`).
- Any legacy UI design or styling references in existing `docs/` specifications are overridden by the `hallmark` skill guidelines.
- Every page and component design must follow Hallmark anti-AI-slop principles (pre-flight scan, genre detection, macrostructure pick, 2+1 font discipline, locked tokens, 8-state component discipline, mobile responsiveness, and slop-test gates).
