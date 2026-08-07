export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const meetingId = query.meetingId;

  const result = await $fetch(
    `${config.public.baseApiUrl}/api/meeting/${meetingId}/live`,
    {
      method: "GET",
      query: {
        _data: "",
      },
    },
  );

  return result;
});
