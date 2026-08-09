export default defineEventHandler(async (_) => {
  await $fetch(`http://localhost:5005/reboot`, {
    method: "POST",
  });
  return {};
});
