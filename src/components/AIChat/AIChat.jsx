import { useState, useCallback } from 'react';
import { useProperties } from '../../hooks/useProperties';
import { useAIChat } from '../../hooks/useAIChat';
import { AnimatePresence } from 'framer-motion';
import AIChatButton from './AIChatButton';
import AIChatWindow from './AIChatWindow';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { listings } = useProperties();
  const { messages, typing, sendMessage } = useAIChat(listings || []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleSendMessage = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleSuggestedPrompt = useCallback((prompt) => {
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <AIChatWindow
            isOpen={isOpen}
            onClose={handleClose}
            onMinimize={handleMinimize}
            messages={messages}
            typing={typing}
            onSendMessage={handleSendMessage}
            onSuggestedPrompt={handleSuggestedPrompt}
          />
        )}
      </AnimatePresence>

      <AIChatButton
        onClick={isMinimized ? handleOpen : () => setIsOpen(!isOpen)}
        hasUnread={isMinimized}
      />
    </>
  );
};

export default AIChat;
