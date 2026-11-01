// server/api/score.get.ts
export default defineCachedEventHandler(
    async (event) => {
        const url = buildSpielberichtUrl(getQuery(event));
        const $ = await loadSpielbericht(url);

        const text = byClasses($, "md:text-8xl text-6xl font-bold")
            .toArray()
            .map((el) => $(el).text().replace(/\s+/g, ""))
            .join("");

        const m = text.match(/(\d+):(\d+)/);
        if (!m) {
            throw createError({ statusCode: 502, statusMessage: "Score not found" });
        }

        return { home: Number(m[1]), guest: Number(m[2]) };
    },
    {
        maxAge: 15,
        swr: true,
        getKey: (e) => `score-${JSON.stringify(getQuery(e))}`,
    },
);