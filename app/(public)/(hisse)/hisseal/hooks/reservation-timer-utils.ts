export function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export async function fetchReservationExpiry(
  transactionId: string
): Promise<{ timeLeftSeconds: number; expiresAt: number } | { timeLeftSeconds: 0; expiresAt: null } | null> {
  if (!transactionId) return null;

  try {
    const response = await fetch(
      `/api/check-reservation-status?transaction_id=${transactionId}`
    );
    if (!response.ok) return null;

    const data = await response.json();

    if (data.status === "active" && data.expires_at) {
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      const timeLeftMs = Math.max(0, expiresAt - now);
      const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

      return {
        timeLeftSeconds,
        expiresAt,
      };
    }

    if (data.status === "expired") {
      return { timeLeftSeconds: 0, expiresAt: null };
    }

    return null;
  } catch (error) {
    console.error("Error fetching reservation status:", error);
    return null;
  }
}
