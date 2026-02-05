export function calculateActualMinutes(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 1;
  return Math.max(1, Math.round(elapsedSeconds / 60));
}
