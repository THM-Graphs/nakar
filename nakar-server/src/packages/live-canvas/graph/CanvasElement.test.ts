import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CanvasElement } from './CanvasElement';
import { CanvasNode } from './CanvasNode';
import { CanvasEdge } from './CanvasEdge';

import type { NodeData } from '../data/NodeData';

void describe('CanvasElement', (): void => {
  void describe('representationCount', (): void => {
    void it('counts an individual element as one', (): void => {
      assert.equal(
        new CanvasNode(TestHarness.node('a')).representationCount(),
        1,
      );
    });
    void it('counts the represented cluster members', (): void => {
      assert.equal(
        new CanvasEdge(
          TestHarness.edge('ab', 'a', 'b', { compressed: ['1', '2'] }),
        ).representationCount(),
        2,
      );
    });
  });
  void describe('toData', (): void => {
    void it('returns a deep copy', (): void => {
      const data: NodeData = TestHarness.node('a');
      const model: CanvasNode = new CanvasNode(data);
      model.toData().properties['name'] = 'changed';
      assert.equal(data.properties['name'], 'a');
    });
  });
  void describe('id', (): void => {
    void it('returns the canonical ID of the referenced data', (): void => {
      const element: CanvasElement = new CanvasNode(TestHarness.node('a'));
      assert.equal(element.id, 'a');
    });
  });
  void describe('kind', (): void => {
    void it('dispatches the element kind polymorphically', (): void => {
      const elements: CanvasElement[] = [
        new CanvasNode(TestHarness.node('a')),
        new CanvasEdge(TestHarness.edge('ab')),
      ];
      assert.deepEqual(
        elements.map((element: CanvasElement): string => element.kind),
        ['node', 'edge'],
      );
    });
  });
  void describe('isCluster', (): void => {
    void it('identifies an individual element', (): void => {
      assert.equal(new CanvasNode(TestHarness.node('a')).isCluster, false);
    });
    void it('identifies a compressed element', (): void => {
      assert.equal(
        new CanvasEdge(
          TestHarness.edge('ab', 'a', 'b', { compressed: ['1', '2'] }),
        ).isCluster,
        true,
      );
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const data: NodeData = TestHarness.node('a');
      const element: CanvasElement = new CanvasNode(data);
      data.properties['name'] = 'updated';
      assert.equal(element.toData().properties['name'], 'updated');
    });
  });
});
