import { useState } from 'react';
import { api } from '../lib/api';

export type SupportedLanguage = 'es' | 'en';

export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('es');
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<string, string>>({});

  const translate = async (text: string, targetLang: SupportedLanguage): Promise<string> => {
    // Si el idioma es español, devuelve el texto original
    if (targetLang === 'es') {
      return text;
    }

    // Crear una clave de caché
    const cacheKey = `${text}_${targetLang}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setLoading(true);
    try {
      const result = await api.translateText(text, targetLang);
      const translated = result.translatedText || text;

      // Guardar en caché
      setCache((prev) => ({ ...prev, [cacheKey]: translated }));

      return translated;
    } catch (err) {
      console.error('Error traduciendo:', err);
      return text; // Fallback al texto original
    } finally {
      setLoading(false);
    }
  };

  const switchLanguage = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
  };

  return {
    currentLang,
    switchLanguage,
    translate,
    loading,
  };
}
