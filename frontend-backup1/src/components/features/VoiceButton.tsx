import { Volume2, Loader2, Square } from 'lucide-react';
import { useState } from 'react';
import { THEME } from '../../lib/constants';
import { api } from '../../lib/api';

interface VoiceButtonProps {
  productId: string;
  text?: string;
}

export function VoiceButton({ productId, text = 'Escuchar descripción' }: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayVoice = async () => {
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.synthesizeVoice(productId);
      const audio = new Audio(result.audioUrl);

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setError('Error reproduciendo audio');
        setIsPlaying(false);
      };

      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en síntesis de voz';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePlayVoice}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md disabled:opacity-50"
        style={{
          backgroundColor: isPlaying ? THEME.colors.primary : THEME.colors.accent,
          color: isPlaying ? 'white' : THEME.colors.primary,
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando...</span>
          </>
        ) : isPlaying ? (
          <>
            <Square className="w-4 h-4" />
            <span>Detener</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>{text}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: THEME.colors.primary }}>
          {error}
        </p>
      )}
    </div>
  );
}
