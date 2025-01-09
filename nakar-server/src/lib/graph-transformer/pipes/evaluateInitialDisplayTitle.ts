import { Node } from 'neo4j-driver';
import { getStringValueOfProperties } from './getStringValueOfProperties';
import { getStringValueOfFirstProperty } from './getStringValueOfFirstProperty';

export function evaluateInitialDisplayTitle(node: Node): string {
  return (
    getStringValueOfProperties(node.properties, 'name') ??
    getStringValueOfProperties(node.properties, 'label') ??
    getStringValueOfFirstProperty(node.properties) ??
    node.labels.join(', ')
  );
}
