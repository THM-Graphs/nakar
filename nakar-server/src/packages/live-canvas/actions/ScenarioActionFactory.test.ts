import { InvalidDataError } from '../error/InvalidDataError';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ScenarioActionFactory } from './ScenarioActionFactory';
import { TestHarness } from '../testing/TestHarness.test';

void describe('ScenarioActionFactory', (): void => {
  void describe('create', (): void => {
    void it('resolves circle scenario labels at application time', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const action: ReturnType<ScenarioActionFactory['create']> =
        new ScenarioActionFactory().create({
          type: 'layout',
          layout: { type: 'circle', label: 'Selected', radius: 100 },
        });
      c.context.data.graph.nodes[0].labels = ['Selected'];
      c.context.data.graph.nodes[1].labels = ['Selected'];
      await action.apply(c.context);
      assert.equal(c.context.data.graph.nodes[0].locked, true);
      assert.equal(c.context.data.graph.nodes[1].locked, true);
      assert.equal(c.context.data.graph.nodes[2].locked, false);
    });
    void it('resolves force-directed scenario labels at application time', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      for (const node of c.context.data.graph.nodes) {
        node.locked = true;
      }
      c.context.data.graph.nodes[0].labels = ['Selected'];
      await new ScenarioActionFactory()
        .create({
          type: 'layout',
          layout: { type: 'forceDirected', label: 'Selected' },
        })
        .apply(c.context);
      assert.equal(c.context.data.graph.nodes[0].locked, false);
      assert.equal(c.context.data.graph.nodes[1].locked, true);
    });
    void it('leaves the graph unchanged when a circle instruction has no selection', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const before: ReturnType<typeof c.context.graph.toData> =
        c.context.graph.toData();
      await new ScenarioActionFactory()
        .create({ type: 'layout', layout: { type: 'circle', radius: 100 } })
        .apply(c.context);
      assert.deepEqual(c.context.graph.toData(), before);
    });
    void it('leaves the graph unchanged when a force-directed instruction has no selection', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      const before: ReturnType<typeof c.context.graph.toData> =
        c.context.graph.toData();
      await new ScenarioActionFactory()
        .create({ type: 'layout', layout: { type: 'forceDirected' } })
        .apply(c.context);
      assert.deepEqual(c.context.graph.toData(), before);
    });
    void it('creates ConnectResultNodesAction for connectResultNodes', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({ type: 'connectResultNodes' })
          .constructor.name,
        'ConnectResultNodesAction',
      );
    });
    void it('creates CompressNodesAction for compressNodes', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'compressNodes',
          label: 'Person',
        }).constructor.name,
        'CompressNodesAction',
      );
    });
    void it('creates CompressRelationshipsAction for compressRelationships', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({ type: 'compressRelationships' })
          .constructor.name,
        'CompressRelationshipsAction',
      );
    });
    void it('creates SetViewSettingsAction for resetVisualization', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({ type: 'resetVisualization' })
          .constructor.name,
        'SetViewSettingsAction',
      );
    });
    void it('creates CircleLayoutAction for circle', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'layout',
          layout: { type: 'circle', radius: 100, nodeIds: [] },
        }).constructor.name,
        'CircleLayoutAction',
      );
    });
    void it('creates HierarchyLayoutAction for hierarchy', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'layout',
          layout: { type: 'hierarchy', edgeType: 'KNOWS' },
        }).constructor.name,
        'HierarchyLayoutAction',
      );
    });
    void it('creates ForceDirectedLayoutAction for forceDirected', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'layout',
          layout: { type: 'forceDirected', nodeIds: [] },
        }).constructor.name,
        'ForceDirectedLayoutAction',
      );
    });
    void it('creates ConfigureViewAction for setGrowNodesBasedOnDegree', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setGrowNodesBasedOnDegree',
          factor: 4,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setRelationshipClusterSize', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setRelationshipClusterSize',
          factor: 20,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setNodeColor', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setNodeColor',
          label: 'Person',
          colorIndex: 3,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setNodeRadius', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setNodeRadius',
          label: 'Person',
          radius: 50,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setNodeTitleProperty', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setNodeTitleProperty',
          label: 'Person',
          property: 'name',
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setRelationshipColor', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setRelationshipColor',
          edgeType: 'KNOWS',
          colorIndex: 2,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('creates ConfigureViewAction for setRelationshipWidth', (): void => {
      assert.equal(
        new ScenarioActionFactory().create({
          type: 'setRelationshipWidth',
          edgeType: 'KNOWS',
          width: 7,
        }).constructor.name,
        'ConfigureViewAction',
      );
    });
    void it('rejects an unknown action', (): void => {
      const factory: ScenarioActionFactory = new ScenarioActionFactory();
      assert.throws((): void => {
        Reflect.apply(factory.create.bind(factory), undefined, [
          { type: 'unknown' },
        ]);
      }, InvalidDataError);
    });
    void it('rejects an unknown layout', (): void => {
      const factory: ScenarioActionFactory = new ScenarioActionFactory();
      assert.throws((): void => {
        Reflect.apply(factory.create.bind(factory), undefined, [
          { type: 'layout', layout: { type: 'unknown' } },
        ]);
      }, InvalidDataError);
    });
  });
});
