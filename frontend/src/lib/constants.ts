export const THEME = {
  colors: {
    primary: '#6d4aff', accent: '#f4f1ff',
    neutral: { white: '#fff', bg: '#f8f8f8', bgAlt: '#f2f2f2', border: '#e7e7e7', text: '#171717', textLight: '#666', textLighter: '#999' },
  },
  typography: { fontSans: "'Manrope', sans-serif", fontSerif: "'Manrope', sans-serif" },
};
export const COPY = {
  assistant: { suggestions: ['Busco algo cómodo para caminar', 'Quiero ropa para clima frío', 'Algo casual en tonos claros'] },
};

export const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

export const AI_FEATURES = {
  labels: { icon: '✦', name: 'Etiquetas de imagen' },
  altText: { icon: '◌', name: 'Texto alternativo accesible' },
  moderation: { icon: '✓', name: 'Información verificada' },
  description: { icon: '✧', name: 'Descripción generada' },
  sentiment: { icon: '♡', name: 'Sentimiento' },
  translation: { icon: '↔', name: 'Traducción' },
  voice: { icon: '◖', name: 'Descripción por voz' },
};
