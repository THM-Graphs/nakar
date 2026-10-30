import { TestHarness } from '../testing/TestHarness.test';
import type { CanvasData } from '../data/CanvasData';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnlockAllCanvasNodesAction } from './UnlockAllCanvasNodesAction';
import { CanvasActionContext } from './CanvasActionContext';

import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';

void describe('UnlockAllCanvasNodesAction', (): void => {
  void describe('apply', (): void => {
    void it('keeps currently grabbed nodes locked', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const data: CanvasData = TestHarness.canvasData([
        TestHarness.node('a', { locked: true }),
        TestHarness.node('b', { locked: true }),
      ]);
      const context: CanvasActionContext = new CanvasActionContext(
        data,
        h.storage.room,
        h.delegates,
      );
      new UnlockAllCanvasNodesAction(
        new SMap([['a', new SSet(['session'])]]),
      ).apply(context);
      assert.equal(data.graph.nodes[0].locked, true);
      assert.equal(data.graph.nodes[1].locked, false);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: UnlockAllCanvasNodesAction =
        new UnlockAllCanvasNodesAction(
          new SMap([['a', new SSet(['session'])]]),
        );
      assert.ok(instance instanceof UnlockAllCanvasNodesAction);
    });
  });
});
