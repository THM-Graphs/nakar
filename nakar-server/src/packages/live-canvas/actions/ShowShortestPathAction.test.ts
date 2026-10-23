import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ShowShortestPathAction } from './ShowShortestPathAction';
import { CanvasError } from '../CanvasError';

void describe('ShowShortestPathAction', (): void => {
  void describe('apply', (): void => {
    void it('deduplicates selected native identities and expands cluster members', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.nodes[2].sourceId = 'other';
      c.context.data.graph.nodes[0].compressed = ['member-1', 'member-2'];
      c.h.source.response = TestHarness.result([TestHarness.node('path')]);
      await new ShowShortestPathAction(['a', 'a', 'b', 'c']).apply(c.context);
      assert.equal(c.h.source.calls.length, 1);
      assert.deepEqual(c.h.source.calls[0].request, {
        type: 'shortestPath',
        nativeIds: ['member-1', 'member-2', 'b'],
      });
      assert.equal(c.context.data.graph.nodes.length, 4);
    });
    void it('skips a source with fewer than two selected nodes', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await new ShowShortestPathAction(['a']).apply(c.context);
      assert.equal(c.h.source.calls.length, 0);
    });
    void it('rejects an unknown node', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        new ShowShortestPathAction(['missing']).apply(c.context),
        CanvasError,
      );
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.nodes[2].sourceId = 'other';
      c.context.data.graph.nodes[0].compressed = ['member-1', 'member-2'];
      c.h.source.response = TestHarness.result([TestHarness.node('path')]);
      const instance: ShowShortestPathAction = new ShowShortestPathAction([
        'a',
        'a',
        'b',
        'c',
      ]);
      assert.ok(instance instanceof ShowShortestPathAction);
    });
  });
});
