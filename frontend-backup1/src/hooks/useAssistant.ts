import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  productRefs?: Array<{ productId: string; name?: string }>;
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || loading) return;
    const snapshot = messages;
    const userMsg: ChatMessage = { role: 'user', text: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);
    try {
      const response = await api.chatAssistant(userMessage, snapshot.map(({ role, text }) => ({ role, text })));
      setMessages((prev) => [...prev, {
        role: 'assistant', text: response.response, productRefs: response.productRefs,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pude conectar con el asistente.');
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  return { messages, loading, error, sendMessage, reset: () => { setMessages([]); setError(null); } };
}
