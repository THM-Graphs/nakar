import { ExpandNodePreviewEntry } from '../../neo4j/expand-node-preview/ExpandNodePreviewEntry';

export interface RoomServiceEventPresentExpandNodePreview {
  type: 'RoomServiceEventPresentExpandNodePreview';
  roomId: string;
  nodeId: string;
  labels: ExpandNodePreviewEntry[];
  relationships: ExpandNodePreviewEntry[];
}
