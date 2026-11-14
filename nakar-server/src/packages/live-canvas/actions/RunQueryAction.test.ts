import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RunQueryAction } from './RunQueryAction';

import type { NodeData } from '../data/NodeData';

void describe('RunQueryAction', (): void => {
  void describe('apply', (): void => {
    void it('extends the graph while retaining scenario metadata and reporting limits', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = {
        ...TestHarness.result([TestHarness.node('d')], [], true),
        table: [{ value: 1 }],
      };
      c.context.data.graph.scenarioId = 'old';
      await new RunQueryAction('source', 'query', false).apply(c.context);
      assert.equal(c.context.data.graph.nodes.length, 4);
      assert.equal(c.context.data.graph.scenarioId, 'old');
      assert.equal(
        c.context.graph.getNode('d').toData().creationReason,
        'query',
      );
      assert.deepEqual(c.context.limits, [2]);
    });
    void it('replaces the graph, table and scenario metadata', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = {
        ...TestHarness.result([TestHarness.node('d')], [], true),
        table: [{ value: 1 }],
      };
      c.context.data.graph.scenarioId = 'old';
      await new RunQueryAction('source', 'query', true).apply(c.context);
      assert.deepEqual(
        c.context.data.graph.nodes.map((entry: NodeData): string => entry.id),
        ['d'],
      );
      assert.equal(c.context.data.graph.scenarioId, null);
      assert.deepEqual(c.context.data.graph.table, [{ value: 1 }]);
      assert.deepEqual(c.context.limits, [2]);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = {
        ...TestHarness.result([TestHarness.node('d')], [], true),
        table: [{ value: 1 }],
      };
      c.context.data.graph.scenarioId = 'old';
      const instance: RunQueryAction = new RunQueryAction(
        'source',
        'query',
        false,
      );
      assert.ok(instance instanceof RunQueryAction);
    });
  });
});
