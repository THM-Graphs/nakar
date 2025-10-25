export class DateTool {
  public static parseExactLocalDate(dateStr: string): Date | null {
    // Strictly match the format YYYY-MM-DDTHH:mm:ss (no timezone)
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

    const match = dateStr.match(regex);
    if (!match) return null;

    const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;

    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // JS Date months are 0-based
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const second = Number(secondStr);

    const date = new Date(year, month, day, hour, minute, second);

    // Verify all parts match (catches invalid dates like Feb 30)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute ||
      date.getSeconds() !== second
    ) {
      return null;
    }

    return date;
  }

  public static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  public static formatSomeDate(date: Date | null): string | null {
    if (date != null) {
      return DateTool.formatDate(date);
    } else {
      return null;
    }
  }
}
