import { useState } from "react";
import { SendHorizonal } from "lucide-react";

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div className="border-t p-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Ask about any property..."
        className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CA3433]"
      />

      <button
        onClick={send}
        className="h-12 w-12 rounded-xl bg-[#CA3433] text-white flex items-center justify-center hover:bg-[#b42d2c]"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
};

export default ChatInput;