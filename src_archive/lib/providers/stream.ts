/**
 * Utility functions for parsing Server-Sent Events (SSE) and NDJSON streams.
 */

export type DeltaCallback = (text: string) => void;

/**
 * Parses a standard Server-Sent Events stream, typical of OpenAI and Anthropic.
 * Expects events formatted as `data: {...}`
 */
export async function parseSSE(
  response: Response,
  onDelta: DeltaCallback,
  extractContent: (data: any) => string | undefined
) {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue; // Standard OpenAI completion marker
          
          try {
            const data = JSON.parse(dataStr);
            const content = extractContent(data);
            if (content) {
              onDelta(content);
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON:', e, 'Raw string:', dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parses a Newline-Delimited JSON (NDJSON) stream, typical of Ollama.
 */
export async function parseNDJSON(
  response: Response,
  onDelta: DeltaCallback,
  extractContent: (data: any) => string | undefined
) {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        try {
          const data = JSON.parse(trimmed);
          const content = extractContent(data);
          if (content) {
            onDelta(content);
          }
        } catch (e) {
          console.error('Failed to parse NDJSON:', e, 'Raw string:', trimmed);
        }
      }
    }
    
    // Process any remaining buffer after stream ends
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        const content = extractContent(data);
        if (content) {
          onDelta(content);
        }
      } catch (e) {
        console.error('Failed to parse NDJSON remainder:', e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Helper to determine which parser to use based on the provider and response
 */
export async function processStream(
  response: Response,
  providerId: string,
  onDelta: DeltaCallback
) {
  if (providerId === 'openai') {
    return parseSSE(response, onDelta, (data) => data?.choices?.[0]?.delta?.content);
  } else if (providerId === 'anthropic') {
    return parseSSE(response, onDelta, (data) => {
      if (data?.type === 'content_block_delta' && data?.delta?.type === 'text_delta') {
        return data.delta.text;
      }
      return undefined;
    });
  } else if (providerId === 'gemini') {
    // With ?alt=sse, Gemini streams standard SSE.
    return parseSSE(response, onDelta, (data) => {
       return data?.candidates?.[0]?.content?.parts?.[0]?.text;
    });
  } else if (providerId === 'ollama') {
    return parseNDJSON(response, onDelta, (data) => data?.message?.content);
  } else {
    throw new Error('Unsupported provider for streaming: ' + providerId);
  }
}
