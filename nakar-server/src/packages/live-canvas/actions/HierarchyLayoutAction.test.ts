import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasActionContext } from './CanvasActionContext';
import { HierarchyLayoutAction } from './HierarchyLayoutAction';

import type { NodeData } from '../data/NodeData';

void describe('HierarchyLayoutAction', (): void => {
  void describe('apply', (): void => {
    void it('lays out a hierarchy and locks the resulting graph', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new HierarchyLayoutAction('KNOWS').apply(c.context);
      const a: NodeData = c.context.graph.getNode('a').toData();
      const b: NodeData = c.context.graph.getNode('b').toData();
      assert.equal(a.locked, true);
      assert.notDeepEqual(a.position, b.position);
      const grabbed: CanvasActionContext = new CanvasActionContext(
        TestHarness.canvasData(),
        c.h.storage.room,
        c.h.delegates,
        ['a'],
      );
      new HierarchyLayoutAction('KNOWS').apply(grabbed);
      assert.deepEqual(grabbed.graph.getNode('a').toData().position, {
        x: 0,
        y: 0,
      });
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: HierarchyLayoutAction = new HierarchyLayoutAction(
        'KNOWS',
      );
      assert.ok(instance instanceof HierarchyLayoutAction);
    });
  });
});
