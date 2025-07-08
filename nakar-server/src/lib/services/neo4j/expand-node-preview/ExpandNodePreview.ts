import { ExpandNodePreviewLabelEntry } from './ExpandNodePreviewLabelEntry';
import { ExpandNodePreviewRelationshipEntry } from './ExpandNodePreviewRelationshipEntry';

export class ExpandNodePreview {
  public constructor(
    public readonly labels: ExpandNodePreviewLabelEntry[],
    public readonly relationships: ExpandNodePreviewRelationshipEntry[],
  ) {}
}
