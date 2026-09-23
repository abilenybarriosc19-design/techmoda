import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { THEME, AI_FEATURES } from '../../lib/constants';
import type { Product } from '../../lib/types';

interface AIProductFeaturesProps {
  product: Product;
}

export function AIProductFeatures({ product }: AIProductFeaturesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Detectar qué features tiene este producto
  const activeFeatures = [];
  if (product.aiLabels && product.aiLabels.length > 0) {
    activeFeatures.push({ key: 'labels', feature: AI_FEATURES.labels, value: product.aiLabels.join(', ') });
  }
  if (product.aiAltText) {
    activeFeatures.push({ key: 'altText', feature: AI_FEATURES.altText, value: product.aiAltText });
  }
  if (product.aiModeration) {
    activeFeatures.push({
      key: 'moderation',
      feature: AI_FEATURES.moderation,
      value: '✓ Contenido verificado',
    });
  }
  if (product.aiDescription) {
    activeFeatures.push({
      key: 'description',
      feature: AI_FEATURES.description,
      value: product.aiDescription,
    });
  }
  if (product.aiSentiment) {
    activeFeatures.push({
      key: 'sentiment',
      feature: AI_FEATURES.sentiment,
      value: 'Análisis disponible',
    });
  }
  if (product.aiTranslations) {
    activeFeatures.push({
      key: 'translation',
      feature: AI_FEATURES.translation,
      value: `${Object.keys(product.aiTranslations).length} idiomas`,
    });
  }
  if (product.aiAudioUrl) {
    activeFeatures.push({
      key: 'voice',
      feature: AI_FEATURES.voice,
      value: '🔊 Escuchar',
    });
  }

  if (activeFeatures.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-6" style={{ borderColor: THEME.colors.neutral.border }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg transition-all"
        style={{
          backgroundColor: THEME.colors.accent,
          color: THEME.colors.neutral.text,
        }}
      >
        <span className="font-medium">🤖 Tecnología aplicada a este producto</span>
        <ChevronDown
          className="w-5 h-5 transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {activeFeatures.map(({ key, feature, value }) => (
            <div
              key={key}
              className="p-4 rounded-lg"
              style={{ backgroundColor: THEME.colors.neutral.bg }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <p
                    className="font-medium text-sm"
                    style={{ color: THEME.colors.neutral.text }}
                  >
                    {feature.name}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: THEME.colors.neutral.textLight }}
                  >
                    {value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
