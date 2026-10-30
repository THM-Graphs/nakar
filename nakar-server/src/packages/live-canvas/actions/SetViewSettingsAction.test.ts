import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SetViewSettingsAction } from './SetViewSettingsAction';

import type { ViewSettingsData } from '../data/ViewSettingsData';

void describe('SetViewSettingsAction', (): void => {
  void describe('apply', (): void => {
    void it('detaches the supplied settings before using them', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const settings: ViewSettingsData = c.context.settings.toData();
      settings.growNodesBasedOnDegreeFactor = 9;
      new SetViewSettingsAction(settings).apply(c.context);
      settings.growNodesBasedOnDegreeFactor = 4;
      assert.equal(c.context.settings.toData().growNodesBasedOnDegreeFactor, 9);
    });
    void it('resets existing settings to defaults', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const settings: ViewSettingsData = c.context.settings.toData();
      settings.growNodesBasedOnDegreeFactor = 9;
      new SetViewSettingsAction(settings).apply(c.context);
      new SetViewSettingsAction().apply(c.context);
      assert.equal(c.context.settings.toData().growNodesBasedOnDegreeFactor, 2);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const settings: ViewSettingsData = c.context.settings.toData();
      settings.growNodesBasedOnDegreeFactor = 9;
      const instance: SetViewSettingsAction = new SetViewSettingsAction(
        settings,
      );
      assert.ok(instance instanceof SetViewSettingsAction);
    });
  });
});
