export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;

  aiLabels?: string[];
  aiLabelsRaw?: { name: string; confidence: number }[];
  aiModeration?: Record<string, unknown>;
  aiAltText?: string;
  aiSentiment?: Record<string, unknown>;
  aiTranslations?: Record<string, string>;
  aiAudioUrl?: string;
  aiDescription?: string;
  aiEmbedding?: number[];
}
