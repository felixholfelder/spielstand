export const formatDate = (date: string) => {
  if (date != null) {
    const d = new Date(date);

    const weekday = new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      timeZone: "Europe/Berlin",
    }).format(d);

    const rest = new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(d);

    return `${weekday}, ${rest}`;
  }

  return "";
};
