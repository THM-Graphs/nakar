import { TestHarness } from './testing/TestHarness.test';
import type { CanvasReference } from './data/CanvasReference';
import assert from 'node:assert/strict';
import type { CanvasData } from './data/CanvasData';
import { describe, it } from 'node:test';
import { CanvasRoom } from './CanvasRoom';
import { CanvasError } from './CanvasError';

void describe('CanvasRoom', (): void => {
  void describe('change', (): void => {
    void it('creates a new empty canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      const created: {
        canvas: CanvasReference | null;
        canvases: CanvasReference[];
      } = await room.change('canvas', 'create');
      assert.equal(created.canvas?.title, 'New Canvas');
    });
    void it('duplicates the selected canvas with detached snapshot data', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      const data: CanvasData = TestHarness.canvasData();
      const duplicate: {
        canvas: CanvasReference | null;
        canvases: CanvasReference[];
      } = await room.change('canvas', 'duplicate', data);
      data.graph.nodes[0].position.x = 10;
      assert.equal(duplicate.canvas?.title, 'Canvas');
      assert.equal(h.room.copies[0]?.graph.nodes[0].position.x, 0);
    });
    void it('uses a default title when duplicating an untitled canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      h.room.canvases[0].title = null;
      assert.equal(
        (await room.change('canvas', 'duplicate')).canvas?.title,
        'New Canvas',
      );
    });
    void it('protects the last canvas from closing', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await assert.rejects(room.change('canvas', 'close'), CanvasError);
    });
    void it('renames the selected canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await room.change('canvas', 'rename', null, 'Renamed');
      assert.equal(h.room.canvases[0].title, 'Renamed');
    });
    void it('closes the other canvases', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await room.change('canvas', 'create');
      await room.change('canvas', 'closeOthers');
      assert.equal(h.room.canvases.length, 1);
    });
    void it('closes the selected canvas when another canvas remains', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await room.change('canvas', 'create');
      await room.change('canvas', 'close');
      assert.equal(h.room.canvases.length, 1);
      assert.equal(h.room.canvases[0].id, 'canvas-1');
    });
    void it('rejects a missing canvas reference', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await assert.rejects(room.change('absent', 'create'), CanvasError);
    });
    void it('rejects a canvas belonging to another room', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const room: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      h.room.canvases[0].roomId = 'foreign';
      await assert.rejects(room.change('canvas', 'closeOthers'), CanvasError);
    });
    void it('serializes concurrent transactions across canvas-room instances', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const a: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      const b: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      await a.change('canvas', 'create');
      const outcomes: [
        PromiseSettledResult<{
          canvas: CanvasReference | null;
          canvases: CanvasReference[];
        }>,
        PromiseSettledResult<{
          canvas: CanvasReference | null;
          canvases: CanvasReference[];
        }>,
      ] = await Promise.allSettled([
        a.change('canvas', 'close'),
        b.change('canvas-1', 'close'),
      ]);
      assert.equal(
        outcomes.filter(
          (
            outcome: PromiseSettledResult<{
              canvas: CanvasReference | null;
              canvases: CanvasReference[];
            }>,
          ): boolean => outcome.status === 'fulfilled',
        ).length,
        1,
      );
      assert.equal(h.room.canvases.length, 1);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const instance: CanvasRoom = new CanvasRoom(h.storage.room, h.room);
      assert.ok(instance instanceof CanvasRoom);
    });
  });
});
