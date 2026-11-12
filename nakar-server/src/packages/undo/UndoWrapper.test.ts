import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UndoWrapper } from './UndoWrapper';

interface TestState {
  count: number;
  tags: string[];
}

const copyState = (input: TestState): TestState => {
  return { count: input.count, tags: [...input.tags] };
};

const createUndoWrapper = (
  maximumStackSize: number,
): UndoWrapper<TestState> => {
  return new UndoWrapper<TestState>({ count: 0, tags: [] }, copyState, {
    maximumStackSize: maximumStackSize,
  });
};

void describe('UndoWrapper', (): void => {
  void describe('transaction', (): void => {
    void it('updates current state and exposes undo action', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);

      // when
      const nextState: TestState = undo.transaction(
        'increment',
        (input: TestState): TestState => {
          return { count: input.count + 1, tags: [...input.tags, 'changed'] };
        },
      );

      // then
      assert.equal(nextState.count, 1);
      assert.deepEqual(nextState.tags, ['changed']);
      assert.equal(undo.current.count, 1);
      assert.equal(undo.info.canUndo, true);
      assert.equal(undo.info.canRedo, false);
      assert.equal(undo.info.undoAction, 'increment');
      assert.equal(undo.info.redoAction, null);
    });

    void it('trims oldest entries at maximum stack size', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(2);
      undo.transaction('one', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.transaction('two', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });

      // when
      undo.transaction('three', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      const previous: TestState = undo.undo();
      const oldest: TestState = undo.undo();
      let error: unknown;
      try {
        undo.undo();
      } catch (caught: unknown) {
        error = caught;
      }

      // then
      assert.equal(previous.count, 2);
      assert.equal(oldest.count, 1);
      assert.ok(error instanceof Error);
      assert.match(error.message, /Unable to get element from stack\./);
    });
  });

  void describe('undo', (): void => {
    void it('restores the previous state and exposes redo action', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);
      undo.transaction('one', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.transaction('two', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });

      // when
      const undone: TestState = undo.undo();

      // then
      assert.equal(undone.count, 1);
      assert.equal(undo.info.undoAction, 'one');
      assert.equal(undo.info.redoAction, 'two');
    });

    void it('rejects access to history cleared by reset', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);
      undo.transaction('increment', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.reset({ count: 10, tags: ['fresh'] });

      // when
      let error: unknown;
      try {
        undo.undo();
      } catch (caught: unknown) {
        error = caught;
      }

      // then
      assert.ok(error instanceof Error);
      assert.match(error.message, /Unable to get element from stack\./);
    });
  });

  void describe('redo', (): void => {
    void it('restores the undone state and exposes undo action', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);
      undo.transaction('one', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.transaction('two', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.undo();

      // when
      const redone: TestState = undo.redo();

      // then
      assert.equal(redone.count, 2);
      assert.equal(undo.info.undoAction, 'two');
      assert.equal(undo.info.redoAction, null);
    });

    void it('rejects access to history cleared by reset', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);
      undo.transaction('increment', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.undo();
      undo.reset({ count: 10, tags: ['fresh'] });

      // when
      let error: unknown;
      try {
        undo.redo();
      } catch (caught: unknown) {
        error = caught;
      }

      // then
      assert.ok(error instanceof Error);
      assert.match(error.message, /Unable to get element from stack\./);
    });
  });

  void describe('snapshot', (): void => {
    void it('preserves the captured state after later mutations', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);

      // when
      undo.snapshot('snapshot');
      undo.current.tags.push('mutated-after-snapshot');
      const restored: TestState = undo.undo();

      // then
      assert.deepEqual(restored.tags, []);
      assert.equal(undo.info.redoAction, 'snapshot');
    });
  });

  void describe('reset', (): void => {
    void it('replaces current state and clears history flags', (): void => {
      // given
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);
      undo.transaction('increment', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });

      // when
      undo.reset({ count: 10, tags: ['fresh'] });

      // then
      assert.equal(undo.current.count, 10);
      assert.deepEqual(undo.current.tags, ['fresh']);
      assert.equal(undo.info.canUndo, false);
      assert.equal(undo.info.canRedo, false);
    });
  });
});
