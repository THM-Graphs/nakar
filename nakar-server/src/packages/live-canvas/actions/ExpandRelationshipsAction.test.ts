import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ExpandRelationshipsAction } from './ExpandRelationshipsAction';

void describe('ExpandRelationshipsAction', (): void => {
  void describe('apply', (): void => {
    void it('ignores an individual relationship', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await new ExpandRelationshipsAction(['ab']).apply(c.context);
      assert.equal(c.h.source.calls.length, 0);
    });
    void it('ignores an unknown relationship', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await new ExpandRelationshipsAction(['missing']).apply(c.context);
      assert.equal(c.h.source.calls.length, 0);
    });
    void it('replaces a cluster through its source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges[0].compressed = ['r1', 'r2'];
      c.h.source.response = TestHarness.result(
        [],
        [TestHarness.edge('r1'), TestHarness.edge('r2')],
      );
      await new ExpandRelationshipsAction(['ab']).apply(c.context);
      assert.equal(c.context.data.graph.edges.length, 2);
      assert.equal(c.h.source.calls[0].request.type, 'relationships');
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: ExpandRelationshipsAction = new ExpandRelationshipsAction(
        ['ab'],
      );
      assert.ok(instance instanceof ExpandRelationshipsAction);
    });
  });
});
