export const DEFAULT_GAMES_COUNT_FONT_SIZE = 260;
export const GAMES_COUNT_FONT_SIZE_STEP = 20;

const STORAGE_KEY = "selectedFontSize";

function readFromStorage(): number | null {
  if (!import.meta.client) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeToStorage(value: number) {
  if (!import.meta.client) return;
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function useGamesCountFontSize() {
  const fontSize = useState<number>(
      "games-count-font-size",
      () => readFromStorage() ?? DEFAULT_GAMES_COUNT_FONT_SIZE,
  );

  watch(fontSize, (value) => {
    writeToStorage(value);
  });

  function increase() {
    fontSize.value = Math.min(
        fontSize.value + GAMES_COUNT_FONT_SIZE_STEP,
    );
  }

  function decrease() {
    fontSize.value = Math.max(
        fontSize.value - GAMES_COUNT_FONT_SIZE_STEP,
    );
  }

  return {
    fontSize,
    increase,
    decrease,
  };
}