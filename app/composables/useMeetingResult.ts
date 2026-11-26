import type { LiveMeeting } from "~/models/live-meeting";

/**
 * Konfiguration für win_point_decision = "WINPOINT":
 * Anzahl gewonnener Begegnungen (Gewinnpunkt), ab der ein Spiel entschieden ist,
 * je play_mode. Hier trägst du weitere Spielsysteme ein.
 *
 * Fehlt ein Eintrag für den play_mode, wird wie bei ALLGAMES bis zum
 * offiziellen Spielende gewartet.
 */
export const WIN_POINTS_BY_PLAY_MODE: Record<string, number> = {
    "TTBL Spielsystem inkl. Doppel": 3,
    "Modifiziertes Swaythling-Cup-System": 4,
    "Werner-Scheffler-System": 8,
    "Sechser-Paarkreuz-System": 9,
};

export const TOTAL_POINTS_BY_PLAY_MODE: Record<string, number> = {
    "Braunschweiger System": 10,
    "Bundessystem": 10,
    "Gera Swaythling-Cup-System": 10,
}

export type MeetingResult =
    | { status: "open" } // noch kein Ergebnis
    | { status: "winner"; side: "home" | "guest" }
    | { status: "draw" };

export function getMeetingResult(meeting: LiveMeeting): MeetingResult {
    const home = meeting.matches_home;
    const guest = meeting.matches_guest;

    if (meeting.win_point_decision === "WINPOINT") {
        const winPoint = WIN_POINTS_BY_PLAY_MODE[meeting.play_mode ?? ""];
        if (winPoint !== undefined) {
            const homeReached = home >= winPoint;
            const guestReached = guest >= winPoint;
            if (homeReached && !guestReached) return { status: "winner", side: "home" };
            if (guestReached && !homeReached) return { status: "winner", side: "guest" };
        }
    }

    if (meeting.win_point_decision === "ALLGAMES") {
        const totalGames = TOTAL_POINTS_BY_PLAY_MODE[meeting.play_mode ?? ""];
        if (totalGames !== undefined) {
            if (home + guest !== totalGames)
                return { status: "open" }

            if (home > guest) return { status: "winner", side: "home" };
            if (home < guest) return { status: "winner", side: "guest" };
            return { status: "draw" };
        }
    }

    // Fallback
    return { status: "open" };
}
