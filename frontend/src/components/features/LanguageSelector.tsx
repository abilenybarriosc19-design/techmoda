import { THEME, LANGUAGE_OPTIONS } from '../../lib/constants';
import type { SupportedLanguage } from '../../hooks/useTranslation';

interface LanguageSelectorProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  currentLang,
  onLanguageChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {LANGUAGE_OPTIONS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code as SupportedLanguage)}
          disabled={disabled}
          className="px-3 py-1 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor:
              currentLang === lang.code ? THEME.colors.primary : THEME.colors.accent,
            color: currentLang === lang.code ? 'white' : THEME.colors.neutral.text,
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
