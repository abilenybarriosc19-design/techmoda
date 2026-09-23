import { THEME } from '../../lib/constants';

const TECH_KEYWORDS = [
  'IA Generativa',
  'Búsqueda Semántica',
  'RAG',
  'Voz',
  'Traducción',
  'Contenido Seguro',
];

export function Footer() {
  return (
    <footer
      className="border-t mt-20"
      style={{
        backgroundColor: THEME.colors.neutral.white,
        borderColor: THEME.colors.neutral.border,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Technology Section */}
        <div className="mb-12 sm:mb-16">
          <h3
            className="text-lg sm:text-xl font-light mb-6"
            style={{
              color: THEME.colors.neutral.text,
              fontFamily: THEME.typography.fontSerif,
            }}
          >
            Tecnología detrás de TechModa
          </h3>

          {/* Tech Keywords - muy sutil */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {TECH_KEYWORDS.map((keyword, idx) => (
              <span
                key={idx}
                className="text-xs sm:text-sm font-light border-b"
                style={{
                  color: THEME.colors.neutral.text,
                  borderColor: THEME.colors.neutral.border,
                  paddingBottom: '4px',
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-8"
          style={{ backgroundColor: THEME.colors.neutral.border }}
        />

        {/* Bottom Info */}
        <div
          className="text-xs sm:text-sm text-center space-y-1"
          style={{ color: THEME.colors.neutral.textLight }}
        >
          <p>TechModa © 2024</p>
          <p>
            Capstone de AWS re/Start • Pista AI Practitioner AIF-C01
          </p>
        </div>
      </div>
    </footer>
  );
}
