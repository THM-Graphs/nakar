import { isNode, isPath, isRelationship } from 'neo4j-driver';
import { match, P } from 'ts-pattern';
import { collectGraphElementsFromFields } from './collectGraphElementsFromFields';
import { GraphElements } from '../types/GraphElements';
import { mergeGraphElements } from './mergeGraphElements';

export function collectGraphElementsFromField(
  key: string,
  field: unknown,
): GraphElements {
  if (isNode(field)) {
    return {
      nodes: [{ ...field, key }],
      relationships: [],
      tableData: [],
    };
  } else if (isRelationship(field)) {
    return {
      nodes: [],
      relationships: [{ ...field, key }],
      tableData: [],
    };
  } else if (isPath(field)) {
    return mergeGraphElements(
      ...field.segments.map((segment) => {
        return mergeGraphElements(
          {
            nodes: [{ ...segment.start, key }],
            relationships: [],
            tableData: [],
          },
          {
            nodes: [{ ...segment.end, key }],
            relationships: [],
            tableData: [],
          },
          {
            nodes: [],
            relationships: [{ ...segment.relationship, key }],
            tableData: [],
          },
        );
      }),
    );
  } else {
    return match(field)
      .with(P.array(), (a) => {
        return collectGraphElementsFromFields(key, a);
      })
      .with(P.map(), (o) => {
        return collectGraphElementsFromFields(key, Object.values(o));
      })
      .otherwise(() => {
        console.debug(
          `Unable to collect nodes and edges from field: ${JSON.stringify(field)}`,
        );
        return { nodes: [], relationships: [], tableData: [] };
      });
  }
}
