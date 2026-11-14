import { TestHarness } from '../testing/TestHarness.test';
import type { HistogramData } from './HistogramData';
import type { HistogramEntry } from './HistogramEntry';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasGraph } from './CanvasGraph';
import { CanvasHistogram } from './CanvasHistogram';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';

import type { GraphData } from '../data/GraphData';

void describe('CanvasHistogram', (): void => {
  void describe('toData', (): void => {
    void it('keeps primitive types distinct using the persisted JSON representation', (): void => {
      const data: GraphData = TestHarness.canvasData(
        [
          TestHarness.node('number', { properties: { value: 1 } }),
          TestHarness.node('string', { properties: { value: '1' } }),
          TestHarness.node('boolean', { properties: { value: true } }),
          TestHarness.node('text', { properties: { value: 'true' } }),
          TestHarness.node('null', { properties: { value: null } }),
          TestHarness.node('null-text', { properties: { value: 'null' } }),
        ],
        [],
      ).graph;
      const values: HistogramEntry[] = new CanvasHistogram(
        data,
        new CanvasViewSettings(),
      ).toData().nodeProperties[0].values;
      assert.equal(values.length, 6);
      assert.deepEqual(
        values.find((entry: HistogramEntry): boolean => entry.value === '1')
          ?.elementIds,
        ['number'],
      );
      assert.deepEqual(
        values.find((entry: HistogramEntry): boolean => entry.value === '"1"')
          ?.elementIds,
        ['string'],
      );
    });
    void it('weights relationship types by represented members while retaining visible IDs', (): void => {
      const data: GraphData = TestHarness.canvasData(undefined, [
        TestHarness.edge('cluster', 'a', 'b', {
          compressed: ['one', 'two', 'three'],
        }),
        TestHarness.edge('other', 'b', 'c', { type: 'OTHER' }),
      ]).graph;
      const histogram: HistogramData = new CanvasHistogram(
        data,
        new CanvasViewSettings(),
      ).toData();
      assert.equal(histogram.edgeTypes[0].count, 3);
      assert.equal(histogram.edgeTypes[0].percentage, 0.75);
      assert.deepEqual(histogram.edgeTypes[0].elementIds, ['cluster']);
    });
    void it('reports sorted label and property values with matching IDs and weighted degrees', (): void => {
      const data: GraphData = TestHarness.canvasData(
        [
          TestHarness.node('a', {
            labels: ['Person', 'Admin'],
            properties: { value: { x: 1 }, nullable: null },
          }),
          TestHarness.node('b', {
            properties: { value: { x: 1 }, flag: false },
          }),
          TestHarness.node('c', { labels: [] }),
        ],
        [
          TestHarness.edge('ab', 'a', 'b', {
            compressed: ['1', '2'],
            properties: { number: 3 },
          }),
          TestHarness.edge('aa', 'a', 'a'),
        ],
      ).graph;
      const histogram: HistogramData = new CanvasHistogram(
        data,
        new CanvasViewSettings(),
      ).toData();
      assert.equal(histogram.nodeLabels[0].count, 2);
      assert.deepEqual(histogram.nodeLabels[0].elementIds, ['a', 'b']);
      assert.equal(histogram.nodeLabels[0].percentage, 2 / 3);
      assert.equal(histogram.nodes[0].degree, 4);
      assert.equal(histogram.nodes[0].percentage, 4 / 6);
      assert.deepEqual(
        histogram.nodeProperties.find(
          (entry: { key: string; values: HistogramEntry[] }): boolean =>
            entry.key === 'value',
        )?.values[0].elementIds,
        ['a', 'b'],
      );
      assert.equal(histogram.edgeProperties[0].values[0].value, '3');
    });
    void it('uses zero degree percentages for isolated nodes', (): void => {
      assert.equal(
        new CanvasHistogram(
          TestHarness.canvasData([TestHarness.node('a')], []).graph,
          new CanvasViewSettings(),
        ).toData().nodes[0].percentage,
        0,
      );
    });
    void it('returns no node entries for an empty graph', (): void => {
      assert.deepEqual(
        new CanvasHistogram(
          new CanvasGraph().toData(),
          new CanvasViewSettings(),
        ).toData().nodes,
        [],
      );
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const data: GraphData = TestHarness.canvasData().graph;
      const histogram: CanvasHistogram = new CanvasHistogram(
        data,
        new CanvasViewSettings(),
      );
      data.nodes.length = 0;
      assert.deepEqual(histogram.toData().nodes, []);
    });
  });
});
