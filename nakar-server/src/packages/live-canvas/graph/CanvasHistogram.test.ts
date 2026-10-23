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
