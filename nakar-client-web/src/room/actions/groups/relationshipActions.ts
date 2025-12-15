import { Action } from "../Action.ts";
import { RemoveRelationshipsAction } from "../RemoveRelationshipsAction.ts";
import { RelationshipsActionParams } from "../RelationshipsActionParams.ts";

export const relationshipActions: Action<RelationshipsActionParams>[] = [
  RemoveRelationshipsAction.shared,
];
