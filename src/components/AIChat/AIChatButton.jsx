import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const AIChatButton = ({ onClick, hasUnread = false }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-[#CA3433] text-white shadow-xl hover:bg-[#b42d2c] transition-colors flex items-center justify-center"
      aria-label="Open AI Chat"
    >
      <MessageCircle size={28} />

      {hasUnread && (
        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
      )}
    </motion.button>
  );
};

export default AIChatButton;