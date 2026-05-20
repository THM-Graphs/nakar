import { Action } from "../Action.ts";
import { FocusRelationshipTypeAction } from "../FocusRelationshipTypeAction.ts";
import { LayoutRelationshipHierarchyAction } from "../LayoutRelationshipHierarchyAction.ts";
import { RelationshipTypeActionParams } from "../RelationshipTypeActionParams.ts";
import { RemoveRelationshipsOfTypeAction } from "../RemoveRelationshipsOfTypeAction.ts";

export const relationshipTypeActions: Action<RelationshipTypeActionParams>[] = [
  RemoveRelationshipsOfTypeAction.shared,
  FocusRelationshipTypeAction.shared,
  LayoutRelationshipHierarchyAction.shared,
];
