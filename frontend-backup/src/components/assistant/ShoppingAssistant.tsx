import { Send } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { THEME, COPY } from '../../lib/constants';
import { useAssistant } from '../../hooks/useAssistant';

interface ShoppingAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  onProductClick?: (productId: string) => void;
}

export function ShoppingAssistant({
  isOpen = true,
  onProductClick,
}: ShoppingAssistantProps) {
  const { messages, loading, sendMessage } = useAssistant();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col h-full max-h-[600px] overflow-hidden"
      style={{ backgroundColor: THEME.colors.neutral.white }}
    >
      {/* Header */}
      <div
        className="px-6 py-8 border-b"
        style={{ borderColor: THEME.colors.neutral.border }}
      >
        <h2
          className="text-2xl font-light mb-2"
          style={{
            color: THEME.colors.neutral.text,
            fontFamily: THEME.typography.fontSerif,
          }}
        >
          {COPY.assistant.title}
        </h2>
        <p
          className="text-sm"
          style={{ color: THEME.colors.neutral.textLight }}
        >
          {COPY.assistant.greeting}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <p
              className="text-sm"
              style={{ color: THEME.colors.neutral.textLight }}
            >
              Prueba con alguna de estas búsquedas:
            </p>
            <div className="space-y-2">
              {COPY.assistant.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="block text-left text-sm font-light py-2 transition-opacity hover:opacity-60"
                  style={{ color: THEME.colors.neutral.text }}
                >
                  • {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <p
                  className="text-xs font-light uppercase tracking-wider"
                  style={{ color: THEME.colors.neutral.textLighter }}
                >
                  {msg.role === 'user' ? 'Tú' : 'Estilista'}
                </p>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: THEME.colors.neutral.text }}
                >
                  {msg.text}
                </p>

                {/* Products grid - muy sutil */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {msg.products.slice(0, 2).map((product) => (
                      <button
                        key={product.productId}
                        onClick={() => onProductClick?.(product.productId)}
                        className="text-left transition-opacity hover:opacity-70"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full aspect-square object-cover mb-2"
                        />
                        <p
                          className="text-xs font-light line-clamp-2"
                          style={{ color: THEME.colors.neutral.text }}
                        >
                          {product.name}
                        </p>
                        <p
                          className="text-xs font-light mt-1"
                          style={{ color: THEME.colors.neutral.textLight }}
                        >
                          ${product.price.toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.colors.primary }} />
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.colors.primary }} />
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.colors.primary }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="px-6 py-6 border-t flex gap-3"
        style={{ borderColor: THEME.colors.neutral.border }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="¿Qué buscas?"
          disabled={loading}
          className="flex-1 text-sm focus:outline-none bg-transparent font-light"
          style={{ color: THEME.colors.neutral.text }}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-1 transition-opacity hover:opacity-60 disabled:opacity-30"
        >
          <Send
            className="w-4 h-4"
            style={{ color: THEME.colors.primary }}
            strokeWidth={1.5}
          />
        </button>
      </form>
    </div>
  );
}
