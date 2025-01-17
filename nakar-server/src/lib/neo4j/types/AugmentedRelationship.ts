import { Relationship } from 'neo4j-driver';

export type AugmentedRelationship = Relationship & { keys: Set<string> };
