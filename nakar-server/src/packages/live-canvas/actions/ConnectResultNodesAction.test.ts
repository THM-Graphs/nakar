import { TestHarness } from '../testing/TestHarness.test';
import type { GraphRequest } from '../delegates/GraphRequest';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConnectResultNodesAction } from './ConnectResultNodesAction';

void describe('ConnectResultNodesAction', (): void => {
  void describe('apply', (): void => {
    void it('groups queries by source and adds only connecting relationships', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.nodes[2].sourceId = 'other';
      c.context.data.graph.nodes[2].compressed = ['member-1', 'member-2'];
      c.h.source.response = TestHarness.result(
        [TestHarness.node('ignored')],
        [TestHarness.edge('bc', 'b', 'c')],
      );
      await new ConnectResultNodesAction().apply(c.context);
      assert.deepEqual(
        c.h.source.calls.map(
          (entry: { sourceId: string; request: GraphRequest }): string =>
            entry.sourceId,
        ),
        ['source', 'other'],
      );
      assert.equal(c.context.data.graph.nodes.length, 3);
      assert.equal(c.context.data.graph.edges.length, 2);
      assert.deepEqual(c.h.source.calls[1].request, {
        type: 'connect',
        nativeIds: ['member-1', 'member-2'],
      });
      c.context.graph.focusNodes([]);
      await new ConnectResultNodesAction().apply(c.context);
      assert.equal(c.h.source.calls.length, 2);
    });
  });
});
