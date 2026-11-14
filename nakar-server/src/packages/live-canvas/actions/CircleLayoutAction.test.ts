import { InvalidDataError } from '../error/InvalidDataError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CircleLayoutAction } from './CircleLayoutAction';

void describe('CircleLayoutAction', (): void => {
  void describe('apply', (): void => {
    void it('resolves a scenario label against nodes present when the action is applied', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const action: CircleLayoutAction = new CircleLayoutAction(
        'Selected',
        100,
      );
      c.context.data.graph.nodes[0].labels = ['Selected'];
      c.context.data.graph.nodes[1].labels = ['Selected'];
      action.apply(c.context);
      assert.equal(c.context.data.graph.nodes[0].locked, true);
      assert.equal(c.context.data.graph.nodes[1].locked, true);
      assert.equal(c.context.data.graph.nodes[2].locked, false);
    });
    void it('places selected nodes on a circle and centers adjacent unlocked nodes', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges.push(TestHarness.edge('bc', 'b', 'c'));
      new CircleLayoutAction(['a', 'b', 'missing'], 100).apply(c.context);
      assert.ok(
        Math.abs(
          Math.hypot(
            c.context.graph.getNode('a').toData().position.x,
            c.context.graph.getNode('a').toData().position.y,
          ) - 100,
        ) < 0.001,
      );
      assert.equal(c.context.graph.getNode('b').toData().locked, true);
      const position: { x: number; y: number } = c.context.graph
        .getNode('c')
        .toData().position;
      const neighbor: { x: number; y: number } = c.context.graph
        .getNode('b')
        .toData().position;
      assert.ok(
        Math.abs(
          Math.hypot(position.x - neighbor.x, position.y - neighbor.y) - 10,
        ) < 0.000001,
      );
    });
    void it('leaves a selection with fewer than two nodes unchanged', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new CircleLayoutAction(['a'], 100).apply(c.context);
      assert.equal(c.context.graph.getNode('a').toData().locked, false);
    });
    void it('preserves locked nodes outside the selection', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('c').setLocked(true);
      new CircleLayoutAction(['a', 'b'], 100).apply(c.context);
      assert.deepEqual(c.context.graph.getNode('c').toData().position, {
        x: 0,
        y: 0,
      });
    });
    void it('preserves isolated unlocked nodes outside the selection', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new CircleLayoutAction(['a', 'b'], 100).apply(c.context);
      assert.deepEqual(c.context.graph.getNode('c').toData().position, {
        x: 0,
        y: 0,
      });
    });
    void it('rejects radius 0', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      assert.throws((): void => {
        new CircleLayoutAction([], 0).apply(c.context);
      }, InvalidDataError);
    });
    void it('rejects radius -1', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      assert.throws((): void => {
        new CircleLayoutAction([], -1).apply(c.context);
      }, InvalidDataError);
    });
    void it('rejects radius NaN', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      assert.throws((): void => {
        new CircleLayoutAction([], NaN).apply(c.context);
      }, InvalidDataError);
    });
    void it('rejects radius Infinity', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      assert.throws((): void => {
        new CircleLayoutAction([], Infinity).apply(c.context);
      }, InvalidDataError);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.data.graph.edges.push(TestHarness.edge('bc', 'b', 'c'));
      const instance: CircleLayoutAction = new CircleLayoutAction(
        ['a', 'b', 'missing'],
        100,
      );
      assert.ok(instance instanceof CircleLayoutAction);
    });
  });
});
