import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { callDeepseekWeatherChat, type ChatMessage } from "@/lib/deepseek-api";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WeatherSnapshot {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

interface WeatherChatbotProps {
  city: string;
  weather: WeatherSnapshot | null;
  loading?: boolean;
}

const roleLabel: Record<string, string> = {
  assistant: "CitySense AI",
  user: "You",
};

export const WeatherChatbot = ({
  city,
  weather,
  loading,
}: WeatherChatbotProps) => {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your CitySense weather assistant. Ask me anything about current conditions, comfort levels, or planning activities in your city.",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const weatherContext = useMemo(() => {
    if (!weather) {
      return `Real-time weather data for ${city} is currently unavailable.`;
    }

    return [
      `Location: ${city}`,
      `Temperature: ${weather.temperature.toFixed(1)}°C`,
      `Conditions: ${weather.description}`,
      `Humidity: ${weather.humidity}%`,
      `Wind speed: ${weather.windSpeed} m/s`,
      `Surface pressure: ${weather.pressure} hPa`,
    ].join(" | ");
  }, [city, weather]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSubmitting) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSubmitting(true);

    try {
      const historyForApi = nextMessages.filter(
        (message) => message.id !== "welcome"
      );
      const { message } = await callDeepseekWeatherChat({
        messages: historyForApi,
        weatherContext,
      });
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Weather assistant unavailable",
        description:
          error instanceof Error
            ? error.message
            : "Unable to reach DeepSeek right now.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="group h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-sky-400 hover:bg-sky-500 border-0 hover:w-auto w-14 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="h-6 w-6 text-white flex-shrink-0" />
            <span className="text-white font-medium whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 overflow-hidden">
              AI Chatbot
            </span>
          </div>
          <span className="sr-only">Open Weather AI Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto z-[2002]"
      >
        <SheetHeader>
          <SheetTitle>Weather AI Assistant</SheetTitle>
          <SheetDescription>
            Chat about current weather trends and planning tips for {city}.
            {(loading || isSubmitting) && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <ScrollArea className="h-[60vh] rounded-md border border-border/40 bg-background/40">
            <div className="p-3 space-y-3 text-sm">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg px-3 py-2",
                    message.role === "assistant"
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {roleLabel[message.role] ?? message.role}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about humidity, comfort levels, or what to pack..."
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !input.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Powered by AI with live Open-Meteo conditions.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WeatherChatbot;
