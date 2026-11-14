import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CompressNodesAction } from './CompressNodesAction';

void describe('CompressNodesAction', (): void => {
  void describe('apply', (): void => {
    void it('obtains cluster ids from the runtime delegate', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges = [
        TestHarness.edge('ac', 'a', 'c'),
        TestHarness.edge('bc', 'b', 'c'),
      ];
      new CompressNodesAction('Person').apply(c.context);
      assert.equal(
        c.context.graph.getNode('generated-1').representationCount(),
        2,
      );
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges = [
        TestHarness.edge('ac', 'a', 'c'),
        TestHarness.edge('bc', 'b', 'c'),
      ];
      const instance: CompressNodesAction = new CompressNodesAction('Person');
      assert.ok(instance instanceof CompressNodesAction);
    });
  });
});
