import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CompressRelationshipsAction } from './CompressRelationshipsAction';

void describe('CompressRelationshipsAction', (): void => {
  void describe('apply', (): void => {
    void it('delegates id creation and compresses parallel relationships', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges.push(TestHarness.edge('ab2'));
      new CompressRelationshipsAction().apply(c.context);
      assert.equal(
        c.context.graph.getEdge('generated-1').representationCount(),
        2,
      );
    });
  });
});
