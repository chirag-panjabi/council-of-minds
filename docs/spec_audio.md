# Audio Handling Specification: Speech-to-Text (STT) & Text-to-Speech (TTS)

## 1. Status & Implementation Gate

- **MVP Scope Status:** Audio features are designated as a **Post-MVP Backlog Capability**. In the initial MVP build, microphone buttons, speaker buttons, voice-ID fields, and audio settings tabs are hidden by default behind a feature flag.
- **Implementation Gate:** Moving audio into production requires validating browser compatibility, user consent flows, per-character cost handling, and WCAG 2.2 AA accessibility controls.

## 2. Speech-to-Text (STT) Architectural Blueprint

STT enables users to dictate prompts directly into the chat input bar.

- **Option A: Native Web Speech API (Default)**
  - *Mechanism:* Uses browser `SpeechRecognition` / `webkitSpeechRecognition`.
  - *Pros:* Zero setup, zero latency, free, native browser integration.
  - *Cons:* Vendor-dependent (Chrome routes speech audio through Google cloud servers; Safari uses Apple servers; Firefox is experimental).
- **Option B: Local Whisper / Parakeet (Advanced / Power User)**
  - *Mechanism:* Local Whisper model running via Transformers.js in-browser or local API endpoint.
  - *Pros:* 100% private, offline, high accuracy.
  - *Cons:* Requires downloading ~500MB+ model weights to client storage.
- **Architecture:** Phase 1 uses Native Web Speech API as the primary STT engine with an abstract interface allowing local Whisper adapters to plug in seamlessly.

## 3. Text-to-Speech (TTS) & Persona Voice Binding

TTS allows AI personas to speak responses in distinct voices.

- **Persona Voice ID Binding:** The Persona Creator includes an optional Voice ID dropdown, assigning specific voice IDs to personas.
- **TTS Provider Strategy:**
  - *Web Speech Synthesis API (Default Fallback):* Free, built-in browser voices. Requires no API keys.
  - *OpenAI TTS:* High quality, natural cadence. Requires user OpenAI API key.
  - *ElevenLabs:* Industry-leading expressive voice synthesis & voice cloning. Requires user ElevenLabs API key.

## 4. UI Components & Interaction Specifications

- **Chat Input Microphone Button:** A mic icon inside the input bar. Clicking toggles listening mode (renders an accessible pulsing visual indicator). Dictated text streams live into the textarea.
- **Message Bubble Speaker Button:** A speaker icon beside completed AI chat bubbles. Clicking streams audio playback. Includes Play/Pause/Stop controls.
- **Settings → Audio Providers Tab:** A dedicated tab under `/settings` to manage ElevenLabs and OpenAI TTS API keys and default voice preferences.

## 5. Privacy, Incognito & Cost Disclosures

- **Privacy Disclosure:** On first microphone activation, displays an explicit disclosure informing the user that OS/browser vendors (Google/Apple) may process microphone audio.
- **Cost Disclosures:** Cloud TTS (OpenAI/ElevenLabs) incurs per-character billing billed directly to the user's BYOK key.
- **Incognito Privacy Guarantee:** In Incognito mode, microphone audio recordings, transcripts, playback history, and audio Blobs are strictly memory-only and never stored in `IndexedDB`.

## 6. Accessibility Requirements

- **Text Primacy:** Text transcripts remain the primary interaction format; audio is strictly supplementary.
- **WCAG 2.2 AA Compliance:** All controls feature explicit labels, visible focus rings, non-color status signals (text badges alongside color indicators), and `prefers-reduced-motion` compliance.
