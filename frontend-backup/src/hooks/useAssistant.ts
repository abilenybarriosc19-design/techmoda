import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  products?: Product[];
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      // Add user message
      const userMsg: ChatMessage = {
        role: 'user',
        text: userMessage,
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const response = await api.chatAssistant(userMessage, messages);

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          text: response.response,
          products: response.products,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error en chat';
        setError(message);
        // Remove the user message if chat failed
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    reset,
  };
}
