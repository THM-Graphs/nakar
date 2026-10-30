import { NotFoundError } from '../error/NotFoundError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LoadNodeAction } from './LoadNodeAction';

void describe('LoadNodeAction', (): void => {
  void describe('apply', (): void => {
    void it('rejects an empty source result', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        new LoadNodeAction('source', 'missing').apply(c.context),
        NotFoundError,
      );
    });
    void it('adds only the first returned node and records its creation reason', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = TestHarness.result([
        TestHarness.node('d'),
        TestHarness.node('e'),
      ]);
      await new LoadNodeAction('source', 'd').apply(c.context);
      assert.equal(c.context.data.graph.nodes.length, 4);
      assert.equal(c.h.source.calls[0].request.type, 'node');
      assert.equal(
        c.context.graph.getNode('d').toData().creationReason,
        'search',
      );
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: LoadNodeAction = new LoadNodeAction('source', 'missing');
      assert.ok(instance instanceof LoadNodeAction);
    });
  });
});
