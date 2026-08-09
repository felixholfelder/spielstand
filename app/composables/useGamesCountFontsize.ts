export const DEFAULT_GAMES_COUNT_FONT_SIZE = 260;
export const MIN_GAMES_COUNT_FONT_SIZE = 80;
export const MAX_GAMES_COUNT_FONT_SIZE = 400;
export const GAMES_COUNT_FONT_SIZE_STEP = 20;

export function useGamesCountFontSize() {
  const fontSize = useState<number>(
    "games-count-font-size",
    () => DEFAULT_GAMES_COUNT_FONT_SIZE,
  );

  function increase() {
    fontSize.value = Math.min(
      fontSize.value + GAMES_COUNT_FONT_SIZE_STEP,
      MAX_GAMES_COUNT_FONT_SIZE,
    );
  }

  function decrease() {
    fontSize.value = Math.max(
      fontSize.value - GAMES_COUNT_FONT_SIZE_STEP,
      MIN_GAMES_COUNT_FONT_SIZE,
    );
  }

  return {
    fontSize,
    increase,
    decrease,
    MIN_GAMES_COUNT_FONT_SIZE,
    MAX_GAMES_COUNT_FONT_SIZE,
  };
}
