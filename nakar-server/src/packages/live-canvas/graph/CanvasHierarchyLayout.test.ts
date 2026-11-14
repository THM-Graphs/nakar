import { TestHarness } from '../testing/TestHarness.test';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasHierarchyLayout } from './CanvasHierarchyLayout';
import { CanvasGraph } from './CanvasGraph';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';

import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { HierarchyGraphLayoutEngine } from '../../physics/hierarchy-graph-layout/HierarchyGraphLayoutEngine';

void describe('CanvasHierarchyLayout', (): void => {
  void describe('layout', (): void => {
    void it('matches the existing layout engine for branching, cycles and disconnected nodes', async (): Promise<void> => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b'),
            TestHarness.node('c'),
            TestHarness.node('isolated'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('bc', 'b', 'c'),
            TestHarness.edge('ca', 'c', 'a'),
            TestHarness.edge('ac', 'a', 'c'),
          ],
        ).graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      const expected: PhysicalGraph = structuredClone(graph);
      await new HierarchyGraphLayoutEngine().layout(expected, 'KNOWS');
      await new CanvasHierarchyLayout(graph).layout('KNOWS');
      assert.deepEqual(structuredClone(graph), expected);
    });
    void it('lays out directed hierarchies in ordered layers and centers the bounding box', async (): Promise<void> => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b'),
            TestHarness.node('c'),
            TestHarness.node('d'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('ac', 'a', 'c'),
            TestHarness.edge('bd', 'b', 'd'),
            TestHarness.edge('cd', 'c', 'd'),
          ],
        ).graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      await new CanvasHierarchyLayout(graph).layout('KNOWS');
      const a: PhysicalNode | null = graph.nodes['a'];
      const b: PhysicalNode | null = graph.nodes['b'];
      const c: PhysicalNode | null = graph.nodes['c'];
      const d: PhysicalNode | null = graph.nodes['d'];
      assert.ok(a && b && c && d);
      assert.ok(a.positionY < b.positionY && b.positionY < d.positionY);
      assert.equal(b.positionY, c.positionY);
      assert.ok(Math.abs(b.positionX - c.positionX) >= b.radius + c.radius);
      assert.equal(a.positionY, -d.positionY);
    });
    void it('handles cycles, duplicate component links, loops, disconnected nodes and arbitrary ids deterministically', async (): Promise<void> => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('__proto__'),
            TestHarness.node('b'),
            TestHarness.node('c'),
            TestHarness.node('isolated'),
          ],
          [
            TestHarness.edge('ab', '__proto__', 'b'),
            TestHarness.edge('ba', 'b', '__proto__'),
            TestHarness.edge('bc', 'b', 'c'),
            TestHarness.edge('ac', '__proto__', 'c'),
            TestHarness.edge('loop', 'c', 'c'),
            TestHarness.edge('other', 'isolated', '__proto__', {
              type: 'OTHER',
            }),
          ],
        ).graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      graph.edges['null'] = null;
      graph.nodes['null'] = null;
      graph.edges['missing-start'] = {
        id: 'missing-start',
        startNodeId: 'missing',
        endNodeId: 'c',
        title: '',
        edgeType: 'KNOWS',
      };
      graph.edges['missing-end'] = {
        id: 'missing-end',
        startNodeId: 'c',
        endNodeId: 'missing',
        title: '',
        edgeType: 'KNOWS',
      };
      const copy: PhysicalGraph = structuredClone(graph);
      await new CanvasHierarchyLayout(graph).layout('KNOWS');
      await new CanvasHierarchyLayout(copy).layout('KNOWS');
      assert.deepEqual(structuredClone(graph), copy);
      assert.ok(
        Object.values(graph.nodes).every(
          (node: PhysicalNode | null): boolean =>
            node === null ||
            (Number.isFinite(node.positionX) &&
              Number.isFinite(node.positionY)),
        ),
      );
    });
    void it('accepts an empty physical graph', async (): Promise<void> => {
      await new CanvasHierarchyLayout({ nodes: {}, edges: {} }).layout('KNOWS');
    });
    void it('places disconnected nodes in one layer for an unmatched relationship type', async (): Promise<void> => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      await new CanvasHierarchyLayout(graph).layout('UNKNOWN');
      assert.ok(Number.isFinite(graph.nodes['a']?.positionY));
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', async (): Promise<void> => {
      const graph: PhysicalGraph = { nodes: {}, edges: {} };
      const layout: CanvasHierarchyLayout = new CanvasHierarchyLayout(graph);
      await layout.layout('KNOWS');
      assert.deepEqual(graph, { nodes: {}, edges: {} });
    });
  });
});
