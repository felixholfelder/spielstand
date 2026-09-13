export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    const association = query.association;
    const season = "x";
    const clubId = query.clubId;
    const clubSlug = "x";

    const result = await $fetch(
      `${config.public.baseApiUrl}/click-tt/${association}/${season}/verein/${clubId}/${clubSlug}/mannschaften`,
      {
        method: "GET",
        query: {
          _data: "",
        },
      },
    );

    return result;
  },
  {
    maxAge: 60 * 60 * 8, // 8 hours cache
    getKey: (event) => {
      const query = getQuery(event);
      return `teams-${query.association}-${query.clubId}`;
    },
  },
);
