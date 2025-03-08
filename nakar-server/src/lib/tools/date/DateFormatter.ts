export class DateFormatter {
  public constructor(private _date: Date) {}

  public fileNameDate(): string {
    const year: string = this._date.getFullYear().toString();
    const month: string = (this._date.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const day: string = this._date.getDate().toString().padStart(2, '0');
    const hours: string = this._date.getHours().toString().padStart(2, '0');
    const minutes: string = this._date.getMinutes().toString().padStart(2, '0');
    const seconds: string = this._date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
