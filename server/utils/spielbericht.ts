// server/utils/spielbericht.ts
import * as cheerio from "cheerio";

export function buildSpielberichtUrl(q: Record<string, unknown>) {
    const parts = {
        association: String(q.association ?? ""),
        season: String(q.season ?? ""),
        league: "x",
        groupId: String(q.groupId ?? ""),
        matchId: String(q.matchId ?? ""),
    };

    // Nur harmlose Zeichen zulassen, Host bleibt fest (kein SSRF)
    for (const v of Object.values(parts)) {
        if (!/^[\w-]+$/.test(v)) {
            throw createError({ statusCode: 400, statusMessage: "Invalid parameter" });
        }
    }

    const { association, season, league, groupId, matchId } = parts;
    return `https://www.mytischtennis.de/click-tt/${association}/${season}/ligen/${league}/gruppe/${groupId}/spielbericht/${matchId}/x`;
}

export async function loadSpielbericht(url: string) {
    const html = await $fetch<string>(url, { responseType: "text" });
    return cheerio.load(html);
}

// Elemente finden, die ALLE angegebenen Klassen haben
export function byClasses($: cheerio.CheerioAPI, classes: string) {
    const list = classes.split(/\s+/).filter(Boolean);
    return $("[class]").filter((_, el) => list.every((c) => $(el).hasClass(c)));
}