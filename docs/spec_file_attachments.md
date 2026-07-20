# File and Attachment Handling Specification

## Overview

Attachments let a user include supported local files with a message. They are stored Blob-first in the browser and, when sent to a cloud model, their bytes or extracted content transit the same-origin stateless proxy and then the selected provider. The proxy does not persist or log them; the provider's own terms and retention controls still apply.

## 1. Supported Files and Enforced Limits

| Type | Allowed formats | Per-file limit |
| --- | --- | --- |
| Image | PNG, JPEG, WebP | 5 MiB |
| Plain text | TXT, Markdown, CSV | 1 MiB |
| Document | PDF | 5 MiB |

- A message can stage at most **5 files** and **10 MiB total** (the sum of source file byte sizes). Validate this before a file enters staging.
- Reject all other file types, including executable formats and Office documents, in the initial build. Validate MIME type and filename extension; never execute or render an attachment as application code.
- A provider/model may impose a smaller or different capability limit. The effective limit is the stricter of the app limit and the selected model's known capability.

## 2. Local Storage Lifecycle

- **Staging:** Keep a newly selected file in memory while the user edits the message. Store the sent attachment as a Blob plus safe metadata (name, media type, byte size, message ID) in `IndexedDB`.
- **No persisted Base64:** Convert bytes to a provider-required representation only at the send boundary. Do not store Base64 as the canonical local form.
- **Cleanup:** Deleting a message or session removes message-owned attachment blobs. Full backup archives store attachment binaries as separate entries, not Base64 inside message JSON.
- **Incognito:** Keep staged/sent attachment data in memory only. When the Incognito session ends, cancels, or reloads, discard it; it must not enter durable messages, history, search, analytics, or export.

## 3. UI and Interaction

- **Picker:** The paperclip button opens the native file picker and has an accessible name such as `Attach file`.
- **Drag and drop:** The chat area may support dropping files, but the picker is an equivalent keyboard-accessible path. The drop overlay is supplementary feedback, not the only instruction.
- **Staging area:** Show each accepted file's thumbnail or file icon, filename, media type, byte size, and a labelled remove button. Images use meaningful alt text based on the filename; decorative previews are hidden from assistive technology.
- **In-chat display:** Render images inline with an accessible expand action. Documents use labelled controls, not ambiguous pill-shaped links. Do not automatically download a file or open a new window.
- **Errors:** State the specific reason (unsupported type, per-file limit, total limit, quota failure, unreadable file, or provider incompatibility), preserve other staged files, and return focus to a useful control.

## 4. Content Processing and Model Compatibility

- **Images:** Send only to models marked as image-capable by the provider capability data. Reject the send with a model-selection action if image support is absent or unknown.
- **Text files:** Extract text client-side. Before sending, show the user that extracted content will be included and provide a way to remove the attachment; do not silently append invisible file contents to the prompt.
- **PDFs:** Extract text client-side only when a supported parser can do so safely. If extraction fails, explain that the PDF cannot be sent with the selected model rather than sending opaque bytes or silently dropping it.
- **Capability changes:** Recheck every staged attachment if the persona/model/provider changes before send.

## 5. Transmission and Privacy Disclosure

- Before the first attachment send for a provider in a session, and whenever the provider changes, show an inline disclosure naming the route:
  - Cloud model: content, extracted text, and/or image bytes go **browser → same-origin stateless proxy → selected provider**.
  - Local Ollama: content goes **browser → loopback Ollama server** directly and never through the cloud proxy.
- The disclosure states that the app proxy does not retain or log attachments, but the selected provider may handle transmitted data under its own policy. The user must be able to cancel or remove attachments before sending.
- Attachment selection, storage, export, and deletion are local browser operations. They do not upload to a separate app file bucket.

## 6. Accessibility and Safety

- Meet WCAG 2.2 AA for keyboard operation, visible focus, non-color status/error feedback, labelled remove/expand actions, and reduced-motion-safe previews.
- Announce accepted and rejected files through a concise status region without repeatedly reading the entire staging list.
- Do not represent the app as malware scanning or encrypting attachments. Users remain responsible for selecting content they are permitted to send.
