import { Node } from 'neo4j-driver';

export type AugmentedNode = Node & { key: string };
