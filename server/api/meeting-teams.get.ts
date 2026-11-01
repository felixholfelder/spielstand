// server/api/spielbericht-teams.get.ts
export default defineCachedEventHandler(
    async (event) => {
        const url = buildSpielberichtUrl(getQuery(event));
        const $ = await loadSpielbericht(url);

        const names = byClasses(
            $,
            "col-span-3 md:text-h3 text-h4 flex items-center justify-center break-all",
        )
            .toArray()
            .map((el) => $(el).text().trim())
            .filter(Boolean);

        if (names.length < 2) {
            throw createError({ statusCode: 502, statusMessage: "Team names not found" });
        }

        return { home: names[0], guest: names[1] };
    },
    {
        maxAge: 60 * 60 * 24,
        getKey: (e) => `teams-${JSON.stringify(getQuery(e))}`,
    },
);