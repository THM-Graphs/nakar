import { InvalidDataError } from '../error/InvalidDataError';
import { ForbiddenError } from '../error/ForbiddenError';
import { TestHarness } from '../testing/TestHarness.test';
import type { GraphRequest } from '../delegates/GraphRequest';
import type { QueryResult } from '../data/QueryResult';
import type { NodeData } from '../data/NodeData';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CanvasActionContext } from './CanvasActionContext';

void describe('CanvasActionContext', (): void => {
  void describe('preservePositions', (): void => {
    void it('retains live interaction positions and locks over conflicting draft edits', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 50, y: 60 });
      c.context.preservePositions(
        [TestHarness.node('a', { position: { x: 10, y: 20 }, locked: true })],
        ['a'],
      );
      assert.deepEqual(c.context.data.graph.nodes[0].position, {
        x: 10,
        y: 20,
      });
      assert.equal(c.context.data.graph.nodes[0].locked, true);
    });
    void it('retains interaction state even when the user returns to the original values', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 50, y: 60 });
      c.context.graph.getNode('a').setLocked(true);
      c.context.preservePositions([TestHarness.node('a')], ['a']);
      assert.deepEqual(c.context.data.graph.nodes[0].position, { x: 0, y: 0 });
      assert.equal(c.context.data.graph.nodes[0].locked, false);
    });
    void it('does not resurrect a node removed by the action after an interaction', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.deleteElements(['a'], [], [], []);
      c.context.preservePositions([TestHarness.node('a')], ['a']);
      assert.equal(
        c.context.data.graph.nodes.some(
          (node: NodeData): boolean => node.id === 'a',
        ),
        false,
      );
    });
    void it('preserves newer positions of unchanged nodes', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.preservePositions([
        TestHarness.node('a', { position: { x: 100, y: 200 } }),
      ]);
      assert.deepEqual(c.context.data.graph.nodes[0].position, {
        x: 100,
        y: 200,
      });
    });
    void it('retains explicit layout edits and ignores new or removed live nodes', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 5, y: 6 });
      c.context.graph.getNode('b').setLocked(true);
      c.context.data.graph.nodes.push(TestHarness.node('new'));
      c.context.preservePositions([
        TestHarness.node('a', { position: { x: 100, y: 200 } }),
        TestHarness.node('b', { position: { x: 9, y: 9 } }),
      ]);
      assert.deepEqual(c.context.data.graph.nodes[0].position, { x: 5, y: 6 });
      assert.deepEqual(c.context.data.graph.nodes[1].position, { x: 0, y: 0 });
      assert.equal(c.context.data.graph.nodes.at(-1)?.id, 'new');
    });
  });
  void describe('finish', (): void => {
    void it('returns a detached snapshot of the modified draft', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 4, y: 5 });
      assert.equal(c.context.finish().graph.nodes[0].position.x, 4);
      const data: ReturnType<CanvasActionContext['finish']> =
        c.context.finish();
      data.graph.nodes[0].position.x = 99;
      assert.equal(c.context.data.graph.nodes[0].position.x, 4);
    });
    void it('rejects invalid visualization settings', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.settings.label('Person').radius = -1;
      assert.throws((): void => {
        c.context.finish();
      }, InvalidDataError);
    });
  });
  void describe('request', (): void => {
    void it('forwards an authorized detached request to the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await c.context.request('source', { type: 'node', nativeIds: ['a'] });
      assert.equal(c.h.source.calls.length, 1);
      assert.deepEqual(c.h.source.calls[0], {
        sourceId: 'source',
        request: { type: 'node', nativeIds: ['a'] },
      });
    });
    void it('rejects sources outside the project before calling the delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        c.context.request('foreign', { type: 'node', nativeIds: [] }),
        ForbiddenError,
      );
      assert.equal(c.h.source.calls.length, 0);
    });
    void it('protects caller-owned request data from a mutating delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.execute = (
        sourceId: string,
        request: GraphRequest,
      ): Promise<QueryResult> => {
        assert.equal(sourceId, 'source');
        if (request.type === 'node') {
          request.nativeIds.push('delegate');
        }
        return Promise.resolve(TestHarness.result());
      };
      const request: GraphRequest = { type: 'node', nativeIds: ['a'] };
      await c.context.request('source', request);
      assert.deepEqual(request.nativeIds, ['a']);
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 3, y: 4 });
      assert.deepEqual(c.context.data.graph.nodes[0].position, { x: 3, y: 4 });
      assert.equal(c.context.delegates, c.h.delegates);
    });
  });
});
