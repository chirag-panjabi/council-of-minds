# Local LLM Connectivity Specification (Ollama, LM Studio & Local Models)

## 1. Overview & Security Boundary

- **Primary Goal:** Allow power users to connect local LLM engines (Ollama, LM Studio, vLLM/llama.cpp) running on their own hardware for maximum privacy and zero API cost.
- **Direct Browser Connection:** Requests travel **browser → loopback localhost directly**. They never transit the application's same-origin proxy or any remote cloud server.
- **Strict Loopback Host Boundary:** Local provider connections are restricted to loopback destinations (`localhost`, `127.0.0.1`, or `[::1]`). LAN, public IP addresses, tunnels, or arbitrary remote URLs are rejected under this local setting.

## 2. Supported Local Engines & Default Ports

| Engine | Protocol | Default Port | Model Discovery Endpoint | Chat Endpoint |
| --- | --- | --- | --- | --- |
| **Ollama (Default)** | Native Ollama API | `http://localhost:11434` | `/api/tags` | `/api/chat` |
| **LM Studio** | OpenAI-Compatible | `http://localhost:1234` | `/v1/models` | `/v1/chat/completions` |
| **vLLM / llama.cpp** | OpenAI-Compatible | `http://localhost:8000` | `/v1/models` | `/v1/chat/completions` |

*Note: Initial build ships with Ollama enabled by default; LM Studio and vLLM ports are pre-configured in Settings for 1-click enablement.*

## 3. CORS Configuration & Setup Instructions

Because browser security blocks web pages from making background calls to `localhost`, the Settings UI provides exact, copyable setup instructions:
- **Ollama CORS Setup:** Displays exact origin command:
  ```bash
  OLLAMA_ORIGINS="https://app-domain.com" ollama serve
  ```
- **LM Studio CORS Setup:** Directs users to check the *"Enable CORS"* checkbox in LM Studio's Server Control Panel.
- **Official Documentation Link:** Links directly to [official Ollama setup documentation](https://docs.ollama.com/faq). Wildcard CORS (`*`) is discouraged.

## 4. Dynamic Model Auto-Discovery & Connection Testing

- **`Test Connection` Action:** Clicking *Test Connection* in `/settings` pings the local engine's model discovery endpoint (`/api/tags` or `/v1/models`).
- **Dynamic Dropdown Population:** Upon a successful response, the app parses the JSON payload and dynamically populates persona model selectors with the models currently installed on the user's local machine (e.g. `llama3:8b`, `mistral:7b`).

## 5. In-Chat Fallback & Error Handling

If a chat session uses a local persona but the local server is offline or CORS is misconfigured, the chat interface catches the fetch error and displays an actionable inline error message:
> *"Local provider connection failed. Please ensure your local server (Ollama/LM Studio) is running and CORS is configured correctly for this application origin."*

Distinct failure states are handled for:
1. *Server Offline:* Local daemon is not running on configured port.
2. *CORS Blocked:* Browser blocked request due to missing origin header.
3. *Model Not Found:* Selected local model is not currently pulled/installed.

## 6. Privacy & Accessibility Guidelines

- **Privacy Statement:** Local requests stay entirely on the user's device between browser and local daemon.
- **WCAG 2.2 AA Compliance:** Connection status indicators, error alerts, and model discovery loading spinners use accessible live regions, non-color visual badges, and keyboard-operable controls.
