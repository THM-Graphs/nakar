import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FocusNodesAction } from './FocusNodesAction';

import type { NodeData } from '../data/NodeData';

void describe('FocusNodesAction', (): void => {
  void describe('apply', (): void => {
    void it('applies the requested graph selection or removal', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new FocusNodesAction(['a', 'b']).apply(c.context);
      assert.deepEqual(
        c.context.finish().graph.nodes.map((item: NodeData): string => item.id),
        ['a', 'b'],
      );
      assert.equal(c.context.finish().graph.edges.length, 1);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: FocusNodesAction = new FocusNodesAction(['a', 'b']);
      assert.ok(instance instanceof FocusNodesAction);
    });
  });
});
