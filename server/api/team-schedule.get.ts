export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const association = query.association;
  const season = "x";
  const league_slug = "x";
  const groupId = query.groupId;
  const teamId = query.teamId;
  const teamName = "x";
  const filter = "x";

  const result = await $fetch(
    `${config.public.baseApiUrl}/click-tt/${association}/${season}/ligen/${league_slug}/gruppe/${groupId}/mannschaft/${teamId}/${teamName}/spielplan/${filter}`,
    {
      method: "GET",
      query: {
        _data: "",
      },
    },
  );

  return result;
});
