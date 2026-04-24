import { Action } from "../Action.ts";
import { RemoveRelationshipsAction } from "../RemoveRelationshipsAction.ts";
import { RelationshipsActionParams } from "../RelationshipsActionParams.ts";
import { LayoutRelationshipHierarchyAction } from "../LayoutRelationshipHierarchyAction.ts";

export const relationshipActions: Action<RelationshipsActionParams>[] = [
  RemoveRelationshipsAction.shared,
  LayoutRelationshipHierarchyAction.shared,
];
