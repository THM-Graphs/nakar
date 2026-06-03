import { UndoWrapperSettings } from './UndoWrapperSettings';
import { UndoWrapperStack } from './UndoWrapperStack';
import { UndoWrapperInfo } from './UndoWrapperInfo';
import { UndoWrapperStackEntry } from './UndoWrapperStackEntry';

export class UndoWrapper<T> {
  private _current: T;
  private readonly _undoStack: UndoWrapperStack<T>;
  private readonly _redoStack: UndoWrapperStack<T>;
  private readonly _onCopy: (input: T) => T;
  private readonly _settings: UndoWrapperSettings;

  public constructor(
    initialValue: T,
    onCopy: (input: T) => T,
    settings: UndoWrapperSettings,
  ) {
    this._current = initialValue;
    this._undoStack = new UndoWrapperStack(settings.maximumStackSize);
    this._redoStack = new UndoWrapperStack(settings.maximumStackSize);
    this._onCopy = onCopy;
    this._settings = settings;
  }

  public get info(): UndoWrapperInfo {
    return {
      canUndo: this._undoStack.size > 0,
      canRedo: this._redoStack.size > 0,
      undoStackSize: this._undoStack.size,
      redoStackSize: this._redoStack.size,
      undoAction: this._undoStack.peak?.actionTitle ?? null,
      redoAction: this._redoStack.peak?.actionTitle ?? null,
    };
  }
  public get current(): T {
    return this._current;
  }

  public get settings(): UndoWrapperSettings {
    return this._settings;
  }

  public reset(value: T): void {
    this._undoStack.clear();
    this._redoStack.clear();
    this._current = value;
  }

  public transaction(actionTitle: string, action: (input: T) => T): T {
    const copy: T = this._onCopy(this._current);
    const newData: T = action(this._current);
    this._undoStack.push({ element: copy, actionTitle: actionTitle });
    this._redoStack.clear();
    this._current = newData;
    return newData;
  }

  public snapshot(actionTitle: string): void {
    const copy: T = this._onCopy(this._current);
    this._undoStack.push({ element: this._current, actionTitle: actionTitle });
    this._redoStack.clear();
    this._current = copy;
  }

  public undo(): T {
    const newCurrent: UndoWrapperStackEntry<T> = this._undoStack.pop();
    this._redoStack.push({
      element: this._onCopy(this._current),
      actionTitle: newCurrent.actionTitle,
    });
    this._current = newCurrent.element;
    return this._current;
  }

  public redo(): T {
    const newCurrent: UndoWrapperStackEntry<T> = this._redoStack.pop();
    this._undoStack.push({
      element: this._onCopy(this._current),
      actionTitle: newCurrent.actionTitle,
    });
    this._current = newCurrent.element;
    return this._current;
  }
}
