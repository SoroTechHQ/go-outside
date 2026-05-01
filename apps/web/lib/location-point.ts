type DbLikeError = {
  code?: string;
  message?: string;
  details?: string;
};

export function hasValidCoordinates(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number"
    && Number.isFinite(lat)
    && typeof lng === "number"
    && Number.isFinite(lng)
    && lat !== 0
    && lng !== 0;
}

export function toLocationPoint(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export function isMissingLocationPointColumn(error: DbLikeError | null | undefined): boolean {
  if (!error) return false;

  const code = (error.code ?? "").toUpperCase();
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  return (code === "42703" || code === "PGRST204")
    && message.includes("location_point");
}
