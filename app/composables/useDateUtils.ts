export const formatDate = (date: string) => {
  if (date != null) {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "Europe/Berlin",
    }).format(new Date(date));
  }

  return "";
};
