import { ApplicationService } from '../../application/ApplicationService';

export class ToolsService implements ApplicationService {
  public async bootstrap(): Promise<void> {
    /* */
  }

  public async destroy(): Promise<void> {
    /* */
  }

  public createFileNameDate(date: Date): string {
    const year: string = date.getFullYear().toString();
    const month: string = (date.getMonth() + 1).toString().padStart(2, '0');
    const day: string = date.getDate().toString().padStart(2, '0');
    const hours: string = date.getHours().toString().padStart(2, '0');
    const minutes: string = date.getMinutes().toString().padStart(2, '0');
    const seconds: string = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
