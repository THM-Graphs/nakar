import { collectGraphElementsFromField } from './collectGraphElementsFromField';
import { GraphElements } from '../types/GraphElements';
import { mergeGraphElements } from './mergeGraphElements';

export function collectGraphElementsFromFields(
  key: string,
  fields: unknown[],
): GraphElements {
  return mergeGraphElements(
    ...fields.map((subField) => collectGraphElementsFromField(key, subField)),
  );
}
