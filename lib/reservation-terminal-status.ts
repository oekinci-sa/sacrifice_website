/**
 * active ve completed dışındaki rezervasyon durumları: hisseal akışında
 * kullanıcı hisse tablosu (selection) adımına dönmelidir.
 */
export const RESERVATION_STATUSES_REDIRECT_TO_SELECTION = [
  'expired',
  'offline',
  'canceled',
  'timed_out',
] as const;

export function shouldRedirectReservationToSelection(
  status: string | undefined | null
): boolean {
  if (!status) return false;
  return (RESERVATION_STATUSES_REDIRECT_TO_SELECTION as readonly string[]).includes(
    status
  );
}
