# File and Attachment Handling (Multimodal) Specification

## 1. Overview & Storage Strategy

- **Local-First Blob Storage:** Attachments are stored Blob-first in `IndexedDB` associated with their specific chat message. Base64 encoding occurs strictly at the provider send boundary; Base64 is never stored as canonical local data.
- **Zero Server Egress:** There is no remote file upload server or S3 bucket. Attachment processing runs 100% locally in the browser.
- **Proxy Transit Rules:** Cloud model attachments transit browser → same-origin stateless proxy → selected provider. The proxy does not log, cache, or persist attachment content or extracted text. Local Ollama attachments travel browser → loopback `localhost` directly.

## 2. Supported File Types and Enforced Limits

| Type | Allowed Formats | Per-File Limit |
| --- | --- | --- |
| Image | PNG, JPEG, WebP | 5 MiB |
| Plain Text | TXT, Markdown, CSV | 1 MiB |
| Document | PDF (parsed client-side via `pdf.js`) | 5 MiB |

- **Batch Limits:** A message can stage at most **5 files** and **10 MiB total** (sum of source file byte sizes). Validated before staging.
- **Excluded Formats:** Executables, ZIP archives (for chat staging), and Office binaries are rejected in MVP.

## 3. UI Components & Interaction Flows

- **Paperclip Attachment Button:** Accessible paperclip icon in input bar opening native OS file picker.
- **Drag & Drop Overlay:** The entire chat window acts as a drop zone. Dragging a file over the chat renders a semi-transparent overlay stating *"Drop files here to attach"*.
- **Pre-Send Staging Area:** Positioned directly above the chat textarea.
  - *Images:* Displayed as square thumbnails with alt text and a labelled "X" remove button.
  - *Documents:* Displayed with file type icon, filename, byte size, and "X" remove button.
- **In-Chat Display & Lightbox:**
  - Sent images render inline within the chat bubble and are **clickable to open a full-screen Lightbox view**.
  - Documents render as accessible labelled document controls with view/extract options.
- **Model Incompatibility Warnings:** If an image is staged while a text-only model is selected, the UI displays an actionable warning toast: *"The current model does not support image attachments. Please select a vision-capable model."*

## 4. Multimodal Processing & Model Compatibility

- **Image Payload Formatting:** Base64 image bytes are formatted into provider-specific vision payload objects (e.g., OpenAI `image_url` format, Anthropic vision content blocks).
- **Text & Code Extraction:** Extracted text from `.txt`, `.csv`, `.md` files is shown to the user before sending and appended to the prompt as structured text blocks (`[Attached File: filename]\n\n<contents>`).
- **Client-Side PDF Parsing:** Uses `pdf.js` for client-side text extraction. If parsing fails, the UI explains that the PDF cannot be extracted rather than sending opaque binary bytes.

## 5. Incognito & Lifecycle Cleanup

- **Incognito Isolation:** Staged and sent attachments in Incognito sessions reside in memory only. Discarded on session close or page reload; never stored in `IndexedDB`.
- **Message Cleanup:** Deleting a message or clearing a session removes message-owned attachment Blobs from `IndexedDB`.
- **Full Backup Bundling:** Full backup `.zip` exports store attachment Blobs as binary files inside the archive (not Base64 inside JSON).

## 6. Accessibility Guidelines

- WCAG 2.2 AA compliance for dropzones, keyboard file pickers, aria-describedby errors, and focus management.
