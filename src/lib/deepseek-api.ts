export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
}

export interface WeatherChatRequest {
  messages: ChatMessage[];
  weatherContext?: string;
  signal?: AbortSignal;
}

export interface WeatherChatResponse {
  message: ChatMessage;
  raw: unknown;
}

const DEFAULT_MODEL = "deepseek-reasoner";
const DEEPSEEK_DEFAULT_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENAI_DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";

const buildPayload = (messages: ChatMessage[], weatherContext?: string) => {
  const systemPrompt =
    "You are CitySense's friendly urban weather guide. Use the provided weather context to answer user questions with actionable, concise insights. Include key metrics (temperature, humidity, wind) when available, and highlight safety considerations for outdoor activities. If data is missing, be transparent and offer alternatives.";

  const contextSnippet = weatherContext
    ? `\nCurrent weather context:\n${weatherContext}`
    : "";

  const normalisedMessages = messages.map(({ role, content }) => ({ role, content }));

  return {
    model: import.meta.env.VITE_DEEPSEEK_MODEL ?? DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}${contextSnippet}`,
      },
      ...normalisedMessages,
    ],
    temperature: 0.3,
    max_tokens: 600,
  };
};

export async function callDeepseekWeatherChat({
  messages,
  weatherContext,
  signal,
}: WeatherChatRequest): Promise<WeatherChatResponse> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DeepSeek API key. Set VITE_DEEPSEEK_API_KEY in your environment.");
  }

  // Choose API URL: explicit env override > guess based on key shape (OpenAI) > DeepSeek default
  const envUrl = import.meta.env.VITE_DEEPSEEK_API_URL;
  let apiUrl = envUrl ?? DEEPSEEK_DEFAULT_API_URL;
  if (!envUrl && apiKey && typeof apiKey === "string" && apiKey.startsWith("sk-")) {
    // Looks like an OpenAI-style key; prefer OpenAI endpoint for compatibility
    apiUrl = OPENAI_DEFAULT_API_URL;
  }
  const payload = buildPayload(messages, weatherContext);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    // Likely a network or CORS failure
    throw new Error(`Network request to DeepSeek/OpenAI failed: ${err instanceof Error ? err.message : String(err)}. Target URL: ${apiUrl}`);
  }

  // If auth failed (common when using a key against the wrong provider), try the alternate endpoint once
  if (!response.ok && response.status === 401) {
    const alternateUrl = apiUrl === OPENAI_DEFAULT_API_URL ? DEEPSEEK_DEFAULT_API_URL : OPENAI_DEFAULT_API_URL;
    try {
      const altResp = await fetch(alternateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (altResp.ok) {
        response = altResp;
      } else {
        const errText = await altResp.text();
        throw new Error(`Alternate endpoint ${alternateUrl} returned ${altResp.status} ${altResp.statusText}: ${errText}`);
      }
    } catch (altErr) {
      const primaryText = await response.text().catch(() => "<unreadable>");
      throw new Error(`Authentication failed when calling ${apiUrl} (401). Tried alternate ${alternateUrl} and it also failed. Primary response: ${primaryText}. Alternate error: ${altErr instanceof Error ? altErr.message : String(altErr)}. Ensure the API key matches the provider (DeepSeek vs OpenAI) and that CORS/proxy is configured.`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "<unreadable>");
    const hint = response.status === 0 ? "Possible CORS/network issue" : "";
    let parsed;
    try {
      parsed = JSON.parse(errorText);
    } catch {
      parsed = errorText;
    }
    throw new Error(`DeepSeek/OpenAI API error: ${response.status} ${response.statusText}. ${hint} Response: ${JSON.stringify(parsed).slice(0,2000)}`);
  }

  const data = (await response.json()) as any;
  // DeepSeek / LLM providers can return a few different shapes. Try several common ones.
  try {
    const firstChoice = data?.choices?.[0];

    let role: string | undefined;
    let content: string | undefined;

    if (firstChoice) {
      if (firstChoice.message && typeof firstChoice.message === "object") {
        role = firstChoice.message.role ?? "assistant";
        content = firstChoice.message.content ?? firstChoice.message.text;
      } else if (typeof firstChoice.text === "string") {
        role = "assistant";
        content = firstChoice.text;
      } else if (typeof firstChoice === "string") {
        role = "assistant";
        content = firstChoice;
      }
    }

    // Some APIs return output_text or output
    if (!content) {
      content = data?.output_text ?? data?.output ?? data?.result?.output_text;
    }

    if (!content) {
      // As a fallback, stringify the response for debugging in the error message
      const snippet = JSON.stringify(data).slice(0, 2000);
      throw new Error(`DeepSeek API returned an unexpected response format. Response start: ${snippet}`);
    }

    return {
      message: {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        role: (role as any) ?? "assistant",
        content: content as string,
      },
      raw: data,
    };
  } catch (err) {
    // Surface helpful debugging info
    const preview = (() => {
      try {
        return JSON.stringify(data).slice(0, 2000);
      } catch {
        return String(data);
      }
    })();
    throw new Error(`Failed to parse DeepSeek response: ${err instanceof Error ? err.message : String(err)}\nResponse preview: ${preview}`);
  }
}
