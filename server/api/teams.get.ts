export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    const association = query.association;
    const season = "x";
    const clubId = query.clubId;
    const clubSlug = "x";

    const result = await $fetch.raw(
      `${config.public.baseApiUrl}/click-tt/${association}/${season}/verein/${clubId}/${clubSlug}/mannschaften`,
      {
        method: "GET",
        query: {
          _data: "",
        },
      },
    );

    if (result.status !== 200 || (result._data.error !== undefined && result._data.error !== null)) {
      throw createError({
        statusCode: result.status,
        statusMessage: "Unexpected upstream status",
      });
    }

    return result._data;
  },
  {
    maxAge: 60 * 60 * 8, // 8 hours cache
    getKey: (event) => {
      const query = getQuery(event);
      return `teams-${query.association}-${query.clubId}`;
    },
  },
);
