export function clubLogoUrl(
  logoId?: string | number | null,
): string | undefined {
  if (logoId === undefined || logoId === null || logoId === "")
    return undefined;
  return `/api/club-logo?clubLogoId=${encodeURIComponent(String(logoId))}`;
}
