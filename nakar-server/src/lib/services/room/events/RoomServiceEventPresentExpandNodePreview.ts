import { ExpandNodePreviewLabelEntry } from '../../neo4j/expand-node-preview/ExpandNodePreviewLabelEntry';
import { ExpandNodePreviewRelationshipEntry } from '../../neo4j/expand-node-preview/ExpandNodePreviewRelationshipEntry';

export interface RoomServiceEventPresentExpandNodePreview {
  type: 'RoomServiceEventPresentExpandNodePreview';
  roomId: string;
  labels: ExpandNodePreviewLabelEntry[];
  relationships: ExpandNodePreviewRelationshipEntry[];
}
