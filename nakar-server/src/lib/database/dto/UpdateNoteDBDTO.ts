import type { SchemaColor } from '../../../../src-gen/schema';

export interface UpdateNoteDBDTO {
  nodeIds: readonly string[];
  content: string;
  color: SchemaColor | null;
}
