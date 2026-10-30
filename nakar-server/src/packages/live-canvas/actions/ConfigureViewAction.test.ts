import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConfigureViewAction } from './ConfigureViewAction';

import type { ViewSettingsData } from '../data/ViewSettingsData';

void describe('ConfigureViewAction', (): void => {
  void describe('apply', (): void => {
    void it('applies setGrowNodesBasedOnDegree', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setGrowNodesBasedOnDegree',
        factor: 4,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.growNodesBasedOnDegree, true);
      assert.equal(settings.growNodesBasedOnDegreeFactor, 4);
    });
    void it('applies setRelationshipClusterSize', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setRelationshipClusterSize',
        factor: 20,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.compressRelationshipsWidthFactor, 20);
    });
    void it('applies setNodeColor', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setNodeColor',
        label: 'Person',
        colorIndex: 3,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.labels['Person'].colorIndex, 3);
    });
    void it('applies setNodeRadius', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setNodeRadius',
        label: 'Person',
        radius: 50,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.labels['Person'].radius, 50);
      assert.equal(settings.labels['Person'].customRadius, true);
    });
    void it('applies setNodeTitleProperty', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setNodeTitleProperty',
        label: 'Person',
        property: 'name',
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.labels['Person'].titleProperty, 'name');
      assert.equal(settings.labels['Person'].customTitleProperty, true);
    });
    void it('applies setRelationshipColor', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setRelationshipColor',
        edgeType: 'KNOWS',
        colorIndex: 2,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.edges['KNOWS'].colorIndex, 2);
      assert.equal(settings.edges['KNOWS'].customColor, true);
    });
    void it('applies setRelationshipWidth', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new ConfigureViewAction({
        type: 'setRelationshipWidth',
        edgeType: 'KNOWS',
        width: 7,
      }).apply(c.context);
      const settings: ViewSettingsData = c.context.finish().viewSettings;
      assert.equal(settings.edges['KNOWS'].width, 7);
      assert.equal(settings.edges['KNOWS'].customWidth, true);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const instance: ConfigureViewAction = new ConfigureViewAction({
        type: 'setGrowNodesBasedOnDegree',
        factor: 4,
      });
      assert.ok(instance instanceof ConfigureViewAction);
    });
  });
});
