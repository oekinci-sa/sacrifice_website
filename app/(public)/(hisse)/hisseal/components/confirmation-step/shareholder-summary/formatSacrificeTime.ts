export function formatSacrificeTime(timeString: string | null): string {
  if (!timeString) return "-";
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      const [hours, minutes] = timeString.split(":");
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return timeString;
  }
}
