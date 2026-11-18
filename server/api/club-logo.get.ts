const LOGO_ID_PATTERN = /^[\w-]+$/;

// Der Upstream-Aufruf wird serverseitig 8 Stunden gecacht.
// Das Bild wird als Base64 gespeichert, weil Binärdaten sich nicht
// zuverlässig durch den Nitro-Cache serialisieren lassen.
const fetchLogo = defineCachedFunction(
  async (clubLogoId: string) => {
    const config = useRuntimeConfig();

    const res = await $fetch.raw<ArrayBuffer>(
      `${config.public.baseTtPortalApiUrl}/rs/2014/images/${clubLogoId}?pixelHeight=160&onlyScaleSmaller=true&quality=0.9`,
      { method: "GET", responseType: "arrayBuffer" },
    );

    return {
      contentType: res.headers.get("content-type") ?? "image/png",
      data: Buffer.from(res._data as ArrayBuffer).toString("base64"),
    };
  },
  {
    name: "club-logo",
    maxAge: 60 * 60 * 8,
    getKey: (clubLogoId: string) => clubLogoId,
  },
);

export default defineEventHandler(async (event) => {
  const clubLogoId = getQuery(event).clubLogoId;

  // Die ID landet in der Upstream-URL, daher streng prüfen
  if (typeof clubLogoId !== "string" || !LOGO_ID_PATTERN.test(clubLogoId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid clubLogoId",
    });
  }

  let logo;
  try {
    logo = await fetchLogo(clubLogoId);
  } catch (error: any) {
    // $fetch.raw wirft bei Status >= 400 selbst, Status wird durchgereicht
    console.log(error.response);
    throw createError({
      statusCode: error?.statusCode ?? error?.response?.status ?? 502,
      statusMessage: "Logo konnte nicht geladen werden",
    });
  }

  setHeader(event, "Content-Type", logo.contentType);
  // Auch der Browser darf das Logo cachen
  setHeader(event, "Cache-Control", "public, max-age=86400");

  return Buffer.from(logo.data, "base64");
});
