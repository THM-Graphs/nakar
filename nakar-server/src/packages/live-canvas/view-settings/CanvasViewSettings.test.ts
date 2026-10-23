import { InvalidDataError } from '../error/InvalidDataError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasViewSettings } from './CanvasViewSettings';

import type { ViewSettingsData } from '../data/ViewSettingsData';

void describe('CanvasViewSettings', (): void => {
  void describe('constructor', (): void => {
    void it('creates defaults', (): void => {
      assert.equal(
        new CanvasViewSettings().toData().growNodesBasedOnDegreeFactor,
        2,
      );
    });
    void it('references supplied settings', (): void => {
      const data: ViewSettingsData = new CanvasViewSettings().toData();
      const settings: CanvasViewSettings = new CanvasViewSettings(data);
      settings.label('Person').radius = 75;
      assert.equal(data.labels['Person'].radius, 75);
    });
  });
  void describe('toData', (): void => {
    void it('detaches nested settings', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].radius = 90;
      data.growNodesBasedOnDegreeFactor = 4;
      assert.equal(settings.toData().labels['Person'].radius, 40);
      assert.equal(settings.toData().growNodesBasedOnDegreeFactor, 2);
    });
  });
  void describe('label', (): void => {
    void it('creates the default label configuration', (): void => {
      assert.deepEqual(new CanvasViewSettings().label('Person'), {
        radius: 40,
        customRadius: false,
        colorIndex: 0,
        titleProperty: '',
        customTitleProperty: false,
      });
    });
    void it('returns an existing mutable label configuration', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').radius = 70;
      assert.equal(settings.label('Person').radius, 70);
    });
    void it('wraps palette indices after six labels', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      for (let i: number = 0; i < 6; i++) {
        settings.label(String(i));
      }
      assert.equal(settings.label('seventh').colorIndex, 0);
    });
    void it('supports prototype property names', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('__proto__').radius = 70;
      assert.equal(settings.label('__proto__').radius, 70);
    });
  });
  void describe('edge', (): void => {
    void it('creates relationship defaults', (): void => {
      assert.deepEqual(new CanvasViewSettings().edge('OTHER'), {
        width: 2,
        customWidth: false,
        colorIndex: 0,
        customColor: false,
      });
    });
    void it('returns an existing mutable relationship configuration', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.edge('KNOWS').width = 5;
      assert.equal(settings.edge('KNOWS').width, 5);
    });
    void it('supports prototype property names', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.edge('__proto__').width = 5;
      assert.equal(settings.edge('__proto__').width, 5);
    });
  });
  void describe('setFactor', (): void => {
    void it('clamps the lower bound for grow', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('grow', 0);
      assert.equal(settings.toData().growNodesBasedOnDegreeFactor, 1);
      assert.equal(settings.toData().growNodesBasedOnDegree, true);
    });
    void it('clamps the upper bound for grow', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('grow', 2000);
      assert.equal(settings.toData().growNodesBasedOnDegreeFactor, 1000);
      assert.equal(settings.toData().growNodesBasedOnDegree, true);
    });
    void it('accepts an in-range factor for grow', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('grow', 4);
      assert.equal(settings.toData().growNodesBasedOnDegreeFactor, 4);
      assert.equal(settings.toData().growNodesBasedOnDegree, true);
    });
    void it('clamps the lower bound for relationships', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('relationships', 0);
      assert.equal(settings.toData().compressRelationshipsWidthFactor, 1);
    });
    void it('clamps the upper bound for relationships', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('relationships', 2000);
      assert.equal(settings.toData().compressRelationshipsWidthFactor, 1000);
    });
    void it('accepts an in-range factor for relationships', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('relationships', 4);
      assert.equal(settings.toData().compressRelationshipsWidthFactor, 4);
    });
    void it('rejects NaN', (): void => {
      assert.throws((): void => {
        new CanvasViewSettings().setFactor('grow', NaN);
      }, InvalidDataError);
    });
    void it('rejects Infinity', (): void => {
      assert.throws((): void => {
        new CanvasViewSettings().setFactor('grow', Infinity);
      }, InvalidDataError);
    });
    void it('rejects -Infinity', (): void => {
      assert.throws((): void => {
        new CanvasViewSettings().setFactor('grow', -Infinity);
      }, InvalidDataError);
    });
  });
  void describe('title', (): void => {
    void it('uses the cluster labels for a cluster title', (): void => {
      assert.equal(
        new CanvasViewSettings().title(
          TestHarness.node('a', { compressed: ['1', '2'] }),
        ),
        'Person Cluster',
      );
    });
    void it('uses the default name property', (): void => {
      assert.equal(new CanvasViewSettings().title(TestHarness.node('a')), 'a');
    });
    void it('prefers label over name', (): void => {
      assert.equal(
        new CanvasViewSettings().title(
          TestHarness.node('a', {
            properties: { label: 'Label', name: 'Name' },
          }),
        ),
        'Label',
      );
    });
    void it('uses another non-empty string property as fallback', (): void => {
      assert.equal(
        new CanvasViewSettings().title(
          TestHarness.node('a', { properties: { custom: 'Caption' } }),
        ),
        'Caption',
      );
    });
    void it('falls back to labels when no string property is usable', (): void => {
      assert.equal(
        new CanvasViewSettings().title(
          TestHarness.node('a', {
            properties: { nested: {}, nullable: null, custom: false },
          }),
        ),
        'Person',
      );
    });
    void it('handles a configured title', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customTitleProperty = true;
      settings.label('Person').titleProperty = 'chosen';
      assert.equal(
        settings.title(
          TestHarness.node('a', { properties: { chosen: 'Caption' } }),
        ),
        'Caption',
      );
    });
    void it('handles a whitespace-only title', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customTitleProperty = true;
      settings.label('Person').titleProperty = 'chosen';
      assert.equal(
        settings.title(TestHarness.node('a', { properties: { chosen: '  ' } })),
        '',
      );
    });
    void it('handles a numeric title', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customTitleProperty = true;
      settings.label('Person').titleProperty = 'chosen';
      assert.equal(
        settings.title(TestHarness.node('a', { properties: { chosen: 0 } })),
        '',
      );
    });
    void it('handles a null title', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customTitleProperty = true;
      settings.label('Person').titleProperty = 'chosen';
      assert.equal(
        settings.title(TestHarness.node('a', { properties: { chosen: null } })),
        '',
      );
    });
    void it('handles a missing title', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customTitleProperty = true;
      settings.label('Person').titleProperty = 'chosen';
      assert.equal(
        settings.title(TestHarness.node('a', { properties: {} })),
        '',
      );
    });
  });
  void describe('radius', (): void => {
    void it('uses the default radius when degree scaling is disabled', (): void => {
      assert.equal(
        new CanvasViewSettings().radius(TestHarness.node('a'), 0, 0, 1),
        40,
      );
    });
    void it('uses a custom label radius', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customRadius = true;
      settings.label('Person').radius = 20;
      assert.equal(settings.radius(TestHarness.node('a'), 1, 1, 2), 20);
    });
    void it('avoids scaling a graph with equal degrees', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.setFactor('grow', 3);
      assert.equal(settings.radius(TestHarness.node('a'), 1, 1, 1), 40);
    });
    void it('scales degrees with linear', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customRadius = true;
      settings.label('Person').radius = 20;
      settings.setFactor('grow', 3);
      const data: ViewSettingsData = settings.toData();
      data.scaleType = 'linear';
      assert.equal(
        new CanvasViewSettings(data).radius(TestHarness.node('a'), 8, 2, 8),
        60,
      );
    });
    void it('scales degrees with log2', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customRadius = true;
      settings.label('Person').radius = 20;
      settings.setFactor('grow', 3);
      const data: ViewSettingsData = settings.toData();
      data.scaleType = 'log2';
      assert.equal(
        new CanvasViewSettings(data).radius(TestHarness.node('a'), 8, 2, 8),
        60,
      );
    });
    void it('scales degrees with logn', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customRadius = true;
      settings.label('Person').radius = 20;
      settings.setFactor('grow', 3);
      const data: ViewSettingsData = settings.toData();
      data.scaleType = 'logn';
      assert.equal(
        new CanvasViewSettings(data).radius(TestHarness.node('a'), 8, 2, 8),
        60,
      );
    });
    void it('scales degrees with log10', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person').customRadius = true;
      settings.label('Person').radius = 20;
      settings.setFactor('grow', 3);
      const data: ViewSettingsData = settings.toData();
      data.scaleType = 'log10';
      assert.equal(
        new CanvasViewSettings(data).radius(TestHarness.node('a'), 8, 2, 8),
        60,
      );
    });
  });
  void describe('edgeWidth', (): void => {
    void it('uses the minimum width for an individual relationship', (): void => {
      assert.equal(
        new CanvasViewSettings().edgeWidth(TestHarness.edge('single'), 1, 4),
        2,
      );
    });
    void it('scales a cluster by its represented relationships', (): void => {
      assert.equal(
        new CanvasViewSettings().edgeWidth(
          TestHarness.edge('cluster', 'a', 'b', {
            compressed: ['1', '2', '3', '4'],
          }),
          1,
          4,
        ),
        20,
      );
    });
    void it('honors custom widths with equal representation bounds', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.edge('KNOWS').customWidth = true;
      settings.edge('KNOWS').width = 5;
      assert.equal(settings.edgeWidth(TestHarness.edge('single'), 1, 1), 5);
    });
  });
  void describe('validate', (): void => {
    void it('accepts valid label and relationship settings', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      assert.doesNotThrow((): void => {
        settings.validate();
      });
    });
    void it('rejects a non-finite growth factor', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.growNodesBasedOnDegreeFactor = NaN;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a growth factor below one', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.growNodesBasedOnDegreeFactor = 0;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects an excessive cluster factor', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.compressRelationshipsWidthFactor = 1001;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a non-finite radius', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].radius = NaN;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a non-positive radius', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].radius = 0;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a negative node color', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].colorIndex = -1;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a node color above the palette', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].colorIndex = 6;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a fractional node color', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.labels['Person'].colorIndex = 0.5;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a non-finite relationship width', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.edges['KNOWS'].width = Infinity;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a non-positive relationship width', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.edges['KNOWS'].width = 0;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a fractional relationship color', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.edges['KNOWS'].colorIndex = 0.5;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a negative relationship color', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.edges['KNOWS'].colorIndex = -1;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
    void it('rejects a relationship color above the palette', (): void => {
      const settings: CanvasViewSettings = new CanvasViewSettings();
      settings.label('Person');
      settings.edge('KNOWS');
      const data: ViewSettingsData = settings.toData();
      data.edges['KNOWS'].colorIndex = 6;
      assert.throws((): void => {
        new CanvasViewSettings(data).validate();
      }, InvalidDataError);
    });
  });
});
