import { THEME } from '../../lib/constants';
import type { Product } from '../../lib/types';

interface SentimentSummaryProps {
  product: Product;
}

export function SentimentSummary({ product }: SentimentSummaryProps) {
  if (!product.aiSentiment || typeof product.aiSentiment !== 'object') {
    return null;
  }

  const sentiment = product.aiSentiment as {
    Sentiment?: string;
    SentimentScore?: { Positive?: number };
  };
  const sentimentScore = sentiment.Sentiment || 'NEUTRAL';
  const positiveScore = ((sentiment.SentimentScore?.Positive) || 0) * 100;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return '#10b981'; // Green
      case 'NEGATIVE':
        return '#ef4444'; // Red
      default:
        return THEME.colors.neutral.textLight;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'Positivo';
      case 'NEGATIVE':
        return 'Negativo';
      case 'MIXED':
        return 'Mixto';
      default:
        return 'Neutral';
    }
  };

  return (
    <div
      className="p-4 rounded-lg flex items-center justify-between"
      style={{ backgroundColor: THEME.colors.accent }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: THEME.colors.neutral.text }}>
          💬 Sentimiento de Opiniones
        </p>
        <p className="text-sm mt-1" style={{ color: THEME.colors.neutral.textLight }}>
          {positiveScore.toFixed(0)}% opiniones positivas
        </p>
      </div>
      <div
        className="px-3 py-1 rounded-full text-white text-sm font-medium"
        style={{ backgroundColor: getSentimentColor(sentimentScore) }}
      >
        {getSentimentLabel(sentimentScore)}
      </div>
    </div>
  );
}
