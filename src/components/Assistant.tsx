import { useState, useRef, useEffect } from 'react';
import { sendMessage, ChatMessage } from '@/lib/ai';

const Assistant = () => {
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState<number>(300);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant for the CitySense app.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [open]);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendMessage([...messages, userMsg]);
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      const assistantMsg: ChatMessage = { role: 'assistant', content: `Error: ${err.message}` };
      setMessages((m) => [...m, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col border border-border rounded-md bg-card">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <strong>AI Assistant</strong>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(!open)} className="text-sm text-muted-foreground">{open ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      {open && (
        <div className="flex flex-col" style={{ height }}>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-primary/80 text-white' : 'bg-secondary text-foreground'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-border">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message. Shift+Enter for newline. Enter to send."
              rows={2}
              className="w-full p-2 resize-y border border-border rounded-md bg-muted focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">Shift+Enter for newline</div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded bg-primary text-white text-sm"
                  onClick={() => handleSend()}
                  disabled={loading}
                >
                  {loading ? 'Thinking...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
          <div
            style={{ height: 6, cursor: 'ns-resize' }}
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startH = height;
              function onMove(ev: MouseEvent) {
                const dy = ev.clientY - startY;
                const next = Math.max(120, startH + dy);
                setHeight(next);
              }
              function onUp() {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              }
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Assistant;
