import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";

const ChatMessage = ({ message }) => {
  const isBot = message.sender === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && (
        <div className="h-8 w-8 rounded-full bg-[#CA3433] flex items-center justify-center text-white">
          <Bot size={18} />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isBot
            ? "bg-gray-100 text-gray-800"
            : "bg-[#CA3433] text-white"
        }`}
      >
        {message.text}
      </div>

      {!isBot && (
        <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white">
          <User size={18} />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;