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
      nodes: [{ ...field, keys: new Set([key]) }],
      relationships: [],
      tableData: [],
    };
  } else if (isRelationship(field)) {
    return {
      nodes: [],
      relationships: [{ ...field, keys: new Set([key]) }],
      tableData: [],
    };
  } else if (isPath(field)) {
    return mergeGraphElements(
      ...field.segments.map((segment) => {
        return mergeGraphElements(
          {
            nodes: [{ ...segment.start, keys: new Set() }],
            relationships: [],
            tableData: [],
          },
          {
            nodes: [{ ...segment.end, keys: new Set() }],
            relationships: [],
            tableData: [],
          },
          {
            nodes: [],
            relationships: [{ ...segment.relationship, keys: new Set() }],
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
