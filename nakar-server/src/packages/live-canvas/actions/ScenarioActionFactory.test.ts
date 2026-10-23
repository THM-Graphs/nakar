import { InvalidDataError } from '../error/InvalidDataError';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ScenarioActionFactory } from './ScenarioActionFactory';

void describe('ScenarioActionFactory', (): void => {
  void describe('create', (): void => {
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
