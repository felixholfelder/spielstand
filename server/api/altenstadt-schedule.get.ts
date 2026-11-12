// server/api/altenstadt-schedule.get.ts
import * as cheerio from "cheerio";

const SOURCE = "https://www.ttsv-altenstadt.de/termine.php";
const LINK_RE =
    /click-tt\/([\w-]+)\/([\w-]+)\/ligen\/([\w-]+)\/gruppe\/(\d+)\/spielbericht\/(\d+)/;
const ROW_RE =
    /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})\s*Uhr\s+(.+?)\s+-\s+(.+)/;
const OWN_TEAM_RE = /^Erwachsene\s+\d+$/;
const LINK_SEL = 'a[href*="/spielbericht/"]';

export interface ScheduleMeeting {
    matchId: string;
    association: string;
    season: string;
    league: string;
    groupId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    home: string;
    guest: string;
    team: string; // eigene Mannschaft
    isHome: boolean;
}

export default defineCachedEventHandler(
    async () => {
        const html = await $fetch<string>(SOURCE, { responseType: "text" });
        const $ = cheerio.load(html);

        const seen = new Set<string>();
        const meetings: ScheduleMeeting[] = [];

        $(LINK_SEL).each((_, a) => {
            const link = LINK_RE.exec($(a).attr("href") ?? "");
            if (!link) return;
            const [, association, season, league, groupId, matchId] = link;
            if (seen.has(matchId)) return;

            // 1) Größten Vorfahren nehmen, der nur diesen einen Link enthält (= die Zeile)
            let row = $(a);
            for (;;) {
                const parent = row.parent();
                if (!parent.length || parent.is("body")) break;
                if (parent.find(LINK_SEL).length > 1) break;
                row = parent;
            }
            const clone = row.clone();
            clone.find("a").remove(); // Icon-Text "find_in_page" entfernen
            let text = clone.text().replace(/\s+/g, " ").trim();
            let m = ROW_RE.exec(text);

            // 2) Fallback: flache Struktur -> Text vor dem Link bis zum vorherigen Link
            if (!m) {
                const parts: string[] = [];
                let n: any = a.prev;
                while (n && parts.length < 10) {
                    if (n.type === "tag" && $(n).is(LINK_SEL)) break;
                    parts.unshift(n.type === "text" ? n.data : $(n).text());
                    n = n.prev;
                }
                text = parts.join(" ").replace(/\s+/g, " ").trim();
                m = ROW_RE.exec(text);
            }
            if (!m) return;

            const [, dd, mm, yyyy, time, home, guest] = m;
            const ownIsHome = OWN_TEAM_RE.test(home.trim());
            const team = ownIsHome ? home.trim() : guest.trim();
            if (!OWN_TEAM_RE.test(team)) return; // Spiel ohne eigene Mannschaft ignorieren

            seen.add(matchId);
            meetings.push({
                matchId,
                association,
                season,
                league,
                groupId,
                date: `${yyyy}-${mm}-${dd}`,
                time,
                home: home.trim(),
                guest: guest.trim(),
                team,
                isHome: ownIsHome,
            });
        });

        if (meetings.length === 0) {
            throw createError({ statusCode: 502, statusMessage: "No meetings found" });
        }

        meetings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        return { meetings };
    },
    { maxAge: 60 * 10, swr: true, staleMaxAge: 60 * 60 * 24, getKey: () => "altenstadt-schedule" },
);
