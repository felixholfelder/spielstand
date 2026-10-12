export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    const formData = new FormData();
    formData.append("query", query.name as string);
    formData.append("page", query.page as string);
    formData.append("pagesize", "20");

    const result = await $fetch.raw(
      `${config.public.baseApiUrl}/api/search/clubs`,
      {
        method: "POST",
        body: formData,
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
    maxAge: 60 * 60 * 8, // 8 hours Cache
    getKey: (event) => {
      const query = getQuery(event);
      return `clubs-${query.name}-${query.page}`;
    },
  },
);
