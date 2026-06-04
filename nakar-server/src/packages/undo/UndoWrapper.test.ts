import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UndoWrapper } from './UndoWrapper';

interface TestState {
  count: number;
  tags: string[];
}

const copyState = (input: TestState): TestState => {
  return {
    count: input.count,
    tags: [...input.tags],
  };
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
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);

      const nextState: TestState = undo.transaction(
        'increment',
        (input: TestState): TestState => {
          return {
            count: input.count + 1,
            tags: [...input.tags, 'changed'],
          };
        },
      );

      assert.equal(nextState.count, 1);
      assert.deepEqual(nextState.tags, ['changed']);
      assert.equal(undo.current.count, 1);
      assert.equal(undo.info.canUndo, true);
      assert.equal(undo.info.canRedo, false);
      assert.equal(undo.info.undoAction, 'increment');
      assert.equal(undo.info.redoAction, null);
    });

    void it('trims oldest entries at maximum stack size', (): void => {
      const undo: UndoWrapper<TestState> = createUndoWrapper(2);

      undo.transaction('one', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.transaction('two', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.transaction('three', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });

      assert.equal(undo.undo().count, 2);
      assert.equal(undo.undo().count, 1);
      assert.throws((): TestState => {
        return undo.undo();
      }, /Unable to get element from stack\./);
    });
  });

  void describe('undo', (): void => {
    void describe('redo', (): void => {
      void it('moves between states for undo and redo', (): void => {
        const undo: UndoWrapper<TestState> = createUndoWrapper(5);

        undo.transaction('one', (input: TestState): TestState => {
          return { count: input.count + 1, tags: input.tags };
        });
        undo.transaction('two', (input: TestState): TestState => {
          return { count: input.count + 1, tags: input.tags };
        });

        const undone: TestState = undo.undo();
        assert.equal(undone.count, 1);
        assert.equal(undo.info.undoAction, 'one');
        assert.equal(undo.info.redoAction, 'two');

        const redone: TestState = undo.redo();
        assert.equal(redone.count, 2);
        assert.equal(undo.info.undoAction, 'two');
        assert.equal(undo.info.redoAction, null);
      });
    });
  });

  void describe('snapshot', (): void => {
    void it('captures state and is undoable', (): void => {
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);

      undo.snapshot('snapshot');
      undo.current.tags.push('mutated-after-snapshot');

      const restored: TestState = undo.undo();
      assert.deepEqual(restored.tags, []);
      assert.equal(undo.info.redoAction, 'snapshot');
    });
  });

  void describe('reset', (): void => {
    void it('clears history stacks', (): void => {
      const undo: UndoWrapper<TestState> = createUndoWrapper(5);

      undo.transaction('increment', (input: TestState): TestState => {
        return { count: input.count + 1, tags: input.tags };
      });
      undo.reset({ count: 10, tags: ['fresh'] });

      assert.equal(undo.current.count, 10);
      assert.deepEqual(undo.current.tags, ['fresh']);
      assert.equal(undo.info.canUndo, false);
      assert.equal(undo.info.canRedo, false);
      assert.throws((): TestState => {
        return undo.undo();
      }, /Unable to get element from stack\./);
      assert.throws((): TestState => {
        return undo.redo();
      }, /Unable to get element from stack\./);
    });
  });
});
