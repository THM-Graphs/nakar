import type { ExternalGraphDatabaseExpandNodePreviewEntry } from './ExternalGraphDatabaseExpandNodePreviewEntry';

export class ExternalGraphDatabaseExpandNodePreview {
  public constructor(
    public readonly labels: ExternalGraphDatabaseExpandNodePreviewEntry[],
    public readonly relationships: ExternalGraphDatabaseExpandNodePreviewEntry[],
  ) {}

  public static empty(): ExternalGraphDatabaseExpandNodePreview {
    return new ExternalGraphDatabaseExpandNodePreview([], []);
  }
}
