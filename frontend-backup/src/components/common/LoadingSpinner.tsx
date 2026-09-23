import { THEME } from '../../lib/constants';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="w-8 h-8 rounded-full border-4 border-r-transparent animate-spin"
        style={{
          borderColor: THEME.colors.accent,
          borderRightColor: 'transparent',
          borderTopColor: THEME.colors.primary,
        }}
      />
    </div>
  );
}
