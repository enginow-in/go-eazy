import { useState } from "react";
import { getAIResponse } from "../services/aiService";

export const useAIChat = (listings) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: " Hello! I'm your AI assistant. I can help you find properties based on your preferences. How can I assist you today?",
    },
  ]);

  const [typing, setTyping] = useState(false);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setTyping(true);

    setTimeout(() => {
      const reply = getAIResponse(
        text,
        listings || []
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: reply.text,
          properties: reply.properties || [],
        },
      ]);

      setTyping(false);
    }, 800);
  };

  return {
    messages,
    typing,
    sendMessage,
  };
};