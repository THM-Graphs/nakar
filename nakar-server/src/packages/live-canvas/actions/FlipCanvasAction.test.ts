import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FlipCanvasAction } from './FlipCanvasAction';

void describe('FlipCanvasAction', (): void => {
  void describe('apply', (): void => {
    void it('reflects positions across the x axis', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 2, y: 3 });
      new FlipCanvasAction('x').apply(c.context);
      assert.deepEqual(c.context.graph.getNode('a').toData().position, {
        x: 2,
        y: -3,
      });
    });
    void it('reflects positions across the y axis', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 2, y: 3 });
      new FlipCanvasAction('y').apply(c.context);
      assert.deepEqual(c.context.graph.getNode('a').toData().position, {
        x: -2,
        y: 3,
      });
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 2, y: 3 });
      const instance: FlipCanvasAction = new FlipCanvasAction('x');
      assert.ok(instance instanceof FlipCanvasAction);
    });
  });
});
