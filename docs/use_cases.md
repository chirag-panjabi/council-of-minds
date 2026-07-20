# Representative Use Cases for Framework Engine

`framework-engine` is a multi-agent orchestration and experimentation studio. By separating knowledge/frameworks from behavior/prompts, it can support many workflows beyond philosophical discussion. The examples below are illustrative, not an exhaustive promise of every use case or a guarantee of accuracy.

## Important Boundaries

- Model output can be wrong, incomplete, biased, or fabricated. Users must independently verify material facts, sources, calculations, and citations before relying on them.
- The product is not medical, mental-health, legal, financial, or emergency advice. It must not diagnose, treat, or replace a qualified professional. Someone in immediate danger or crisis should contact local emergency or crisis services, not rely on a chat.
- Legal/research use is a private drafting and critique aid, not legal advice or a substitute for a licensed attorney. Do not upload client-confidential, privileged, regulated, or otherwise sensitive material unless the user is authorized to disclose it and understands the selected provider's handling of cloud requests.
- For a cloud model, prompt content and attachments transit the same-origin stateless proxy and the selected provider. For local Ollama, content goes directly to the local server. Choose providers and input material accordingly.

## 1. Personal Reflection and Learning

Use cases for people seeking structured reflection, perspective-taking, or personal growth—not clinical care.

- **Philosophical Council:** A user explores a life dilemma (for example, whether to change jobs) through clearly fictionalized Stoic, Marxist, and Buddhist perspectives.
- **Echo-Chamber Busting:** A user asks a Devil's Advocate or Contrarian persona to challenge a strongly held political or social belief while reviewing claims critically.
- **Socratic Reflection:** A user asks an agent to pose non-directive questions that help them reflect on anxiety or a decision. The interface must not characterize this as therapy or crisis support.
- **Via Negativa Deconstruction:** A user explores a philosophical framework designed to question ego-driven narratives and assumptions.

## 2. Professional and Strategic Work

Use cases for brainstorming and stress-testing, with human review before any decision or external use.

- **Startup Red-Teaming:** A founder uses Skeptical VC, Early Adopter, and Pragmatic CTO personas to expose gaps in a business plan. Attachments are subject to the documented provider-transmission disclosure and limits.
- **Legal Strategy Sandbox:** A qualified professional uses competing frameworks to prepare questions or issue-spotting hypotheses. Outputs require legal review, must not be represented as advice, and must not contain unauthorized confidential material.
- **Marketing and Brand Voice:** A marketer compares differently described brand voices to explore draft copy, while respecting trademarks, rights of publicity, and organizational brand guidelines.
- **Software Architecture Review:** A developer has contrasting personas critique the trade-offs of a proposed system, then validates conclusions through normal engineering review and testing.

## 3. Educational and Academic Use

Use cases for students, teachers, and lifelong learners. Personas portraying historical or literary figures are simulations, not authoritative reproductions of those people.

- **Historical Debates:** A teacher uses multiple historical viewpoints to discuss a modern policy question, then checks the resulting claims against reliable sources.
- **Explain-it-at-different-levels:** A learner compares simple, intermediate, and expert explanations of a topic, checking technical details with course materials or primary sources.
- **Literary Analysis:** Students use contrasting interpretive lenses to generate questions and draft analyses rather than submitting model output unreviewed.

## 4. Creative and Entertainment

Use cases for writers, game designers, and hobbyists.

- **World-Building:** An author creates personas for fictional factions to explore dialogue, conflict, or a peace treaty.
- **Tabletop Role-Playing:** A game master uses a 1-on-1 persona to draft in-character NPC dialogue for unexpected player actions.
- **Fictional Crossovers:** Users explore a fictional debate as a creative exercise, with clear distinction between generated fiction and factual claims.

## 5. AI Research and Prompt Engineering

Use cases for developers and researchers using the app as a local experimentation surface.

- **Model Benchmarking:** A researcher compares outputs from different BYOK models against a pre-defined evaluation set and records methodology, model versions, and limitations; debate output alone is not a benchmark result.
- **Prompt Isolation Testing:** A prompt engineer runs controlled variations independently or through the deliberately sequenced Council flow, then compares results without assuming simultaneous execution.
- **Guardrail Testing:** Authorized researchers test prompts and defensive personas in a controlled environment. Do not use the tool to target third-party systems or evade safeguards.

> [!NOTE]
>
> **Sharing Personas Without a Hosted Marketplace**
>
> Users may export a versioned persona/share code and choose to share it externally, such as on a forum. The open-source product does not operate a hosted marketplace. Imported personas are untrusted prompt content and should be reviewed before use.
