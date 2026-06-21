import { Action } from "../Action.ts";
import { RemoveRelationshipsAction } from "../RemoveRelationshipsAction.ts";
import { ExpandRelationshipClusterAction } from "../ExpandRelationshipClusterAction.ts";
import { RelationshipsActionParams } from "../RelationshipsActionParams.ts";

export const relationshipActions: Action<RelationshipsActionParams>[] = [
  ExpandRelationshipClusterAction.shared,
  RemoveRelationshipsAction.shared,
];
