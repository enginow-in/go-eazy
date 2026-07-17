import { X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedPrompts from './SuggestedPrompts';
import TypingIndicator from './TypingIndicator';
import PropertyCard from './PropertyCard';

const AIChatWindow = ({ isOpen, onClose, messages, typing, onSendMessage, onMinimize, onSuggestedPrompt }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#CA3433] to-[#b42d2c] text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <div>
            <h3 className="font-semibold text-base">GoEazy AI</h3>
            <p className="text-xs text-green-100">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-[#b42d2c] rounded-lg transition-colors"
            aria-label="Minimize chat"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#b42d2c] rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id}>
            <ChatMessage message={message} />
            
            {/* Property Results */}
            {message.properties && message.properties.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {message.properties.map((property, idx) => (
                    <PropertyCard
                      key={property.id || idx}
                      property={property}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {typing && (
          <div>
            <TypingIndicator />
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (only show when there are no user messages yet) */}
      {messages.length === 1 && !typing && (
        <SuggestedPrompts onSelect={onSuggestedPrompt} />
      )}

      {/* Input */}
      <ChatInput onSend={onSendMessage} />
    </motion.div>
  );
};

export default AIChatWindow;
