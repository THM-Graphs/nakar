import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasEdge } from './CanvasEdge';

void describe('CanvasEdge', (): void => {
  void describe('kind', (): void => {
    void it('identifies a relationship', (): void => {
      assert.equal(new CanvasEdge(TestHarness.edge('ab')).kind, 'edge');
    });
  });
  void describe('isDangling', (): void => {
    void it('handles both endpoints', (): void => {
      assert.equal(
        new CanvasEdge(TestHarness.edge('ab')).isDangling(['a', 'b']),
        false,
      );
    });
    void it('handles only the start endpoint', (): void => {
      assert.equal(
        new CanvasEdge(TestHarness.edge('ab')).isDangling(['a']),
        true,
      );
    });
    void it('handles only the end endpoint', (): void => {
      assert.equal(
        new CanvasEdge(TestHarness.edge('ab')).isDangling(['b']),
        true,
      );
    });
    void it('handles no endpoints', (): void => {
      assert.equal(new CanvasEdge(TestHarness.edge('ab')).isDangling([]), true);
    });
    void it('keeps a self-loop when its node exists', (): void => {
      assert.equal(
        new CanvasEdge(TestHarness.edge('aa', 'a', 'a')).isDangling(['a']),
        false,
      );
    });
  });
});
