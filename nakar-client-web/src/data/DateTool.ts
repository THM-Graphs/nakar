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
}
