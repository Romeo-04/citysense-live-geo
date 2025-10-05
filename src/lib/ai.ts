export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Send messages to the AI API using the VITE_AI_API_KEY env var.
 * Note: placing a secret in client-side env exposes it to users. For
 * production, route requests through a server-side proxy.
 */
export async function sendMessage(messages: ChatMessage[]) {
  const key = import.meta.env.VITE_AI_API_KEY;
  if (!key) throw new Error('VITE_AI_API_KEY not set in environment');

  const body = {
    model: 'gpt-3.5-turbo',
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: 800,
  } as any;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  // openai's chat completion shape
  const content = json?.choices?.[0]?.message?.content;
  return content ?? '';
}
