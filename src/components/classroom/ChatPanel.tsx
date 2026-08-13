import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { ClassroomMessage } from "@/lib/classroom";

interface Props {
  messages: ClassroomMessage[];
  myUid: string;
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, myUid, onSend }: Props) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400">No messages yet. Say hello to the class.</p>
        )}
        {messages.map((m, i) => (
          <div key={m.id || i} className={m.uid === myUid ? "text-right" : ""}>
            <p className="text-[11px] text-slate-400">{m.name}</p>
            <p
              className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                m.uid === myUid ? "bg-primary text-primary-foreground" : "bg-slate-700 text-slate-100"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message the class…"
          aria-label="Chat message"
          className="bg-slate-800 border-white/10 text-slate-100 placeholder:text-slate-500"
        />
        <Button type="submit" size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
