import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UnlockNodesAction } from './UnlockNodesAction';

void describe('UnlockNodesAction', (): void => {
  void describe('apply', (): void => {
    void it('unlocks selected existing nodes and ignores unknown ids', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      for (const value of c.context.data.graph.nodes) {
        value.locked = true;
      }
      new UnlockNodesAction(['a', 'missing']).apply(c.context);
      assert.equal(c.context.graph.getNode('a').toData().locked, false);
      assert.equal(c.context.graph.getNode('b').toData().locked, true);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      for (const value of c.context.data.graph.nodes) {
        value.locked = true;
      }
      const instance: UnlockNodesAction = new UnlockNodesAction([
        'a',
        'missing',
      ]);
      assert.ok(instance instanceof UnlockNodesAction);
    });
  });
});
