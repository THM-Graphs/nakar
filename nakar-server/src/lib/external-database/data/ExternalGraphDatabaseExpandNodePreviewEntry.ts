export class ExternalGraphDatabaseExpandNodePreviewEntry {
  public identificator: string;
  public title: string;
  public count: number;

  public constructor(data: {
    identificator: string;
    title: string;
    count: number;
  }) {
    this.identificator = data.identificator;
    this.title = data.title;
    this.count = data.count;
  }
}
