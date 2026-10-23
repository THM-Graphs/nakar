import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ForceDirectedLayoutAction } from './ForceDirectedLayoutAction';

void describe('ForceDirectedLayoutAction', (): void => {
  void describe('apply', (): void => {
    void it('unlocks selected nodes and keeps other locks', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').setLocked(true);
      c.context.graph.getNode('b').setLocked(true);
      new ForceDirectedLayoutAction(['a']).apply(c.context);
      assert.equal(c.context.graph.getNode('a').toData().locked, false);
      assert.equal(c.context.graph.getNode('b').toData().locked, true);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').setLocked(true);
      c.context.graph.getNode('b').setLocked(true);
      const instance: ForceDirectedLayoutAction = new ForceDirectedLayoutAction(
        ['a'],
      );
      assert.ok(instance instanceof ForceDirectedLayoutAction);
    });
  });
});
