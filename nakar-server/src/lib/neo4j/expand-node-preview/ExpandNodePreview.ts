import { ExpandNodePreviewEntry } from './ExpandNodePreviewEntry';

export class ExpandNodePreview {
  public constructor(
    public readonly labels: ExpandNodePreviewEntry[],
    public readonly relationships: ExpandNodePreviewEntry[],
  ) {}
}
