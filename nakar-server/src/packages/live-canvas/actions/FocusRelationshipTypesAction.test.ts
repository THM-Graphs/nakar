import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FocusRelationshipTypesAction } from './FocusRelationshipTypesAction';

import type { NodeData } from '../data/NodeData';

void describe('FocusRelationshipTypesAction', (): void => {
  void describe('apply', (): void => {
    void it('applies the requested graph selection or removal', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new FocusRelationshipTypesAction(['OTHER']).apply(c.context);
      assert.deepEqual(
        c.context.finish().graph.nodes.map((item: NodeData): string => item.id),
        ['a', 'b', 'c'],
      );
      assert.equal(c.context.finish().graph.edges.length, 0);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: FocusRelationshipTypesAction =
        new FocusRelationshipTypesAction(['OTHER']);
      assert.ok(instance instanceof FocusRelationshipTypesAction);
    });
  });
});
