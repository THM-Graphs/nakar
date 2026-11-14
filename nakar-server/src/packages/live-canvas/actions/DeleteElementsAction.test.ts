import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DeleteElementsAction } from './DeleteElementsAction';

import type { NodeData } from '../data/NodeData';

void describe('DeleteElementsAction', (): void => {
  void describe('apply', (): void => {
    void it('applies the requested graph selection or removal', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new DeleteElementsAction(['a']).apply(c.context);
      assert.deepEqual(
        c.context.finish().graph.nodes.map((item: NodeData): string => item.id),
        ['b', 'c'],
      );
      assert.equal(c.context.finish().graph.edges.length, 0);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: DeleteElementsAction = new DeleteElementsAction(['a']);
      assert.ok(instance instanceof DeleteElementsAction);
    });
  });
});
