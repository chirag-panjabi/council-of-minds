# Audio Handling: Post-MVP Future Design

## Status

Audio input and output are **not part of the MVP**. The current build must not present a microphone button, speaker button, Audio Providers settings tab, voice-ID persona field, or auto-play preference as an available feature. This document records constraints for a later, separately scoped implementation.

## 1. Future Speech-to-Text Options

- **Browser speech recognition:** A future opt-in integration may use the browser's Web Speech API where available. It must never be described as universally offline, local, free, or private: browser, OS, language, and vendor behavior vary, and some implementations may transmit audio to a vendor service.
- **Local speech recognition:** A later local Whisper/Parakeet option may be evaluated for users who accept model-download and device-resource requirements.
- **Remote speech recognition:** Any future cloud STT provider requires a dedicated BYOK/privacy/cost decision. Its audio and metadata would follow the cloud request boundary: browser → same-origin stateless proxy → selected provider, with no proxy persistence or logging.

## 2. Future Text-to-Speech Options

- A later implementation may evaluate browser speech synthesis, local synthesis, and separately configured cloud TTS providers.
- Voice assignment, voice cloning, and provider API keys are out of scope until that implementation defines consent, provider support, content policy, data retention, and cost handling.
- Auto-play must be off by default. Users retain a visible, keyboard-operable Play/Stop control for any generated audio.

## 3. Privacy, Incognito, and Cost Requirements

- Before activating browser STT, show a clear disclosure that the browser or OS may process or transmit microphone audio and that handling depends on the user's environment. Request microphone permission only after the user intentionally activates the feature.
- Before a future cloud STT/TTS request, identify the exact provider and explain that audio, transcript, or generated text may be transmitted to it; the provider's policy applies.
- In an Incognito session, audio recordings, intermediate transcripts, playback history, audio-provider usage, and generated audio blobs must not be durably stored, searched, analyzed, or exported. A text message deliberately sent by the user still follows the existing Incognito no-persistence rule.
- Future audio billing must be displayed separately from token estimates when units or pricing differ. Unknown pricing is `N/A`, never assumed to be zero.

## 4. Accessibility Requirements for a Future Implementation

- The text transcript remains the primary equivalent for every STT/TTS interaction; audio is never the only way to receive or provide information.
- Controls have labels, visible focus, keyboard operation, text status feedback, and reduced-motion-safe listening/playback indicators that meet WCAG 2.2 AA.
- Do not use pulsing color as the sole “listening” or “playing” signal. Provide a clear Stop control and do not automatically move focus away from the composer.

## 5. Implementation Gate

Before audio moves out of the future backlog, create a dedicated implementation spec that fixes supported browsers/providers, consent flow, request topology, retention/deletion behavior, failure states, accessibility testing, and cost disclosure. No Phase-1/MVP commitment is implied by this design note.
