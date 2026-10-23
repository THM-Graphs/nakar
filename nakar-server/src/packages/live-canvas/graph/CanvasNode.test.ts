import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasNode } from './CanvasNode';
import { CanvasError } from '../CanvasError';

import type { NodeData } from '../data/NodeData';

void describe('CanvasNode', (): void => {
  void describe('kind', (): void => {
    void it('identifies a node', (): void => {
      assert.equal(new CanvasNode(TestHarness.node('a')).kind, 'node');
    });
  });
  void describe('move', (): void => {
    void it('updates the referenced data with a detached position', (): void => {
      const data: NodeData = TestHarness.node('a');
      const position: { x: number; y: number } = { x: 10, y: -5 };
      new CanvasNode(data).move(position);
      position.x = 99;
      assert.deepEqual(data.position, { x: 10, y: -5 });
    });
    void it('rejects NaN x without modifying the position', (): void => {
      const data: NodeData = TestHarness.node('a');
      assert.throws((): void => {
        new CanvasNode(data).move({ x: NaN, y: 0 });
      }, CanvasError);
      assert.deepEqual(data.position, { x: 0, y: 0 });
    });
    void it('rejects infinite y without modifying the position', (): void => {
      const data: NodeData = TestHarness.node('a');
      assert.throws((): void => {
        new CanvasNode(data).move({ x: 0, y: Infinity });
      }, CanvasError);
      assert.deepEqual(data.position, { x: 0, y: 0 });
    });
    void it('rejects infinite x without modifying the position', (): void => {
      const data: NodeData = TestHarness.node('a');
      assert.throws((): void => {
        new CanvasNode(data).move({ x: -Infinity, y: 0 });
      }, CanvasError);
      assert.deepEqual(data.position, { x: 0, y: 0 });
    });
    void it('rejects NaN y without modifying the position', (): void => {
      const data: NodeData = TestHarness.node('a');
      assert.throws((): void => {
        new CanvasNode(data).move({ x: 0, y: NaN });
      }, CanvasError);
      assert.deepEqual(data.position, { x: 0, y: 0 });
    });
  });
  void describe('setLocked', (): void => {
    void it('locks the referenced node', (): void => {
      const data: NodeData = TestHarness.node('a', { locked: false });
      new CanvasNode(data).setLocked(true);
      assert.equal(data.locked, true);
    });
    void it('unlocks the referenced node', (): void => {
      const data: NodeData = TestHarness.node('a', { locked: true });
      new CanvasNode(data).setLocked(false);
      assert.equal(data.locked, false);
    });
  });
});
