import { NotFoundError } from '../error/NotFoundError';
import { ForbiddenError } from '../error/ForbiddenError';
import { InvalidDataError } from '../error/InvalidDataError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LoadScenarioAction } from './LoadScenarioAction';

void describe('LoadScenarioAction', (): void => {
  void describe('apply', (): void => {
    void it('converts scenario parameters and executes queries and follow-up actions in order', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 4, y: 5 });
      const types: (typeof c.h.storage.scenario.parameters)[number]['dataType'][] =
        ['string', 'number', 'json', 'startDateTime', 'endDateTime'];
      c.h.storage.scenario.parameters = types.map(
        (
          type: (typeof types)[number],
        ): (typeof c.h.storage.scenario.parameters)[number] => ({
          identifier: type,
          title: null,
          dataType: type,
          allowedLabels: [],
        }),
      );
      c.h.storage.scenario.queries.push(
        { sourceId: 'source', query: null, isTableQuery: false },
        { sourceId: 'source', query: 'table', isTableQuery: true },
      );
      c.h.storage.scenario.actions = [
        { type: 'setNodeRadius', label: 'Person', radius: 90 },
        { type: 'setNodeRadius', label: 'Person', radius: 100 },
      ];
      c.h.source.response = {
        ...TestHarness.result(
          [TestHarness.node('a'), TestHarness.node('new')],
          [],
          true,
        ),
        table: [{ value: 9 }],
      };
      const args: Record<string, string> = {
        string: 's',
        number: '42',
        json: '{"x":1}',
        startDateTime: 'start',
        endDateTime: 'end',
      };
      await new LoadScenarioAction('scenario', args).apply(c.context);
      assert.equal(c.h.source.calls.length, 2);
      assert.deepEqual(
        {
          ...(c.h.source.calls[0].request.type === 'query'
            ? c.h.source.calls[0].request.arguments
            : {}),
        },
        {
          string: 's',
          number: 42,
          json: { x: 1 },
          startDateTime: 'start',
          endDateTime: 'end',
        },
      );
      assert.deepEqual(c.context.graph.getNode('a').toData().position, {
        x: 4,
        y: 5,
      });
      assert.equal(c.context.title, 'Scenario');
      assert.equal(c.context.data.graph.scenarioId, 'scenario');
      assert.equal(
        c.context.graph.getNode('new').toData().creationReason,
        'loadScenario',
      );
      assert.deepEqual(c.context.data.graph.table, [{ value: 9 }]);
      assert.equal(c.context.settings.label('Person').radius, 100);
    });
    void it('reloads the current scenario', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 4, y: 5 });
      const types: (typeof c.h.storage.scenario.parameters)[number]['dataType'][] =
        ['string', 'number', 'json', 'startDateTime', 'endDateTime'];
      c.h.storage.scenario.parameters = types.map(
        (
          type: (typeof types)[number],
        ): (typeof c.h.storage.scenario.parameters)[number] => ({
          identifier: type,
          title: null,
          dataType: type,
          allowedLabels: [],
        }),
      );
      c.h.storage.scenario.queries.push(
        { sourceId: 'source', query: null, isTableQuery: false },
        { sourceId: 'source', query: 'table', isTableQuery: true },
      );
      c.h.storage.scenario.actions = [
        { type: 'setNodeRadius', label: 'Person', radius: 90 },
        { type: 'setNodeRadius', label: 'Person', radius: 100 },
      ];
      c.h.source.response = {
        ...TestHarness.result(
          [TestHarness.node('a'), TestHarness.node('new')],
          [],
          true,
        ),
        table: [{ value: 9 }],
      };
      const args: Record<string, string> = {
        string: 's',
        number: '42',
        json: '{"x":1}',
        startDateTime: 'start',
        endDateTime: 'end',
      };
      await new LoadScenarioAction('scenario', args).apply(c.context);
      await new LoadScenarioAction(null).apply(c.context);
      assert.equal(c.h.source.calls.length, 4);
    });
    void it('adds results without replacing scenario metadata or applying follow-up actions', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.title = null;
      c.h.storage.scenario.actions = [
        { type: 'compressNodes', label: 'Person' },
      ];
      c.h.source.response = TestHarness.result([TestHarness.node('extra')]);
      await new LoadScenarioAction('scenario', {}, true).apply(c.context);
      assert.equal(c.context.data.graph.nodes.length, 4);
      assert.equal(c.context.data.graph.scenarioId, null);
      assert.equal(c.context.title, null);
    });
    void it('uses a default title for an untitled scenario', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.title = null;
      c.h.storage.scenario.actions = [
        { type: 'compressNodes', label: 'Person' },
      ];
      await new LoadScenarioAction('scenario').apply(c.context);
      assert.equal(c.context.title, 'New Canvas');
    });
    void it('rejects reloading when no current scenario exists', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        new LoadScenarioAction(null).apply(c.context),
        NotFoundError,
      );
    });
    void it('rejects a scenario from another project', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.projectId = 'foreign';
      await assert.rejects(
        new LoadScenarioAction('scenario').apply(c.context),
        ForbiddenError,
      );
    });
    void it('rejects a scenario with no queries', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.queries = [];
      await assert.rejects(
        new LoadScenarioAction('scenario').apply(c.context),
        NotFoundError,
      );
    });
    void it('rejects unknown supplied parameters', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        new LoadScenarioAction('scenario', { unknown: 'x' }).apply(c.context),
        InvalidDataError,
      );
    });
    void it("rejects numeric parameter ''", async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        { identifier: 'n', dataType: 'number', title: null, allowedLabels: [] },
      ];
      await assert.rejects(
        new LoadScenarioAction('scenario', { n: '' }).apply(c.context),
        InvalidDataError,
      );
    });
    void it("rejects numeric parameter 'bad'", async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        { identifier: 'n', dataType: 'number', title: null, allowedLabels: [] },
      ];
      await assert.rejects(
        new LoadScenarioAction('scenario', { n: 'bad' }).apply(c.context),
        InvalidDataError,
      );
    });
    void it("rejects numeric parameter 'Infinity'", async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        { identifier: 'n', dataType: 'number', title: null, allowedLabels: [] },
      ];
      await assert.rejects(
        new LoadScenarioAction('scenario', { n: 'Infinity' }).apply(c.context),
        InvalidDataError,
      );
    });
    void it('rejects malformed JSON parameters', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        { identifier: 'n', dataType: 'number', title: null, allowedLabels: [] },
      ];
      c.h.storage.scenario.parameters[0].dataType = 'json';
      await assert.rejects(
        new LoadScenarioAction('scenario', { n: 'invalid' }).apply(c.context),
        SyntaxError,
      );
    });
    void it('converts a string parameter for the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        {
          identifier: 'value',
          dataType: 'string',
          title: null,
          allowedLabels: [],
        },
      ];
      await new LoadScenarioAction('scenario', { value: 'caption' }).apply(
        c.context,
      );
      const request: (typeof c.h.source.calls)[number]['request'] =
        c.h.source.calls[0].request;
      assert.equal(request.type, 'query');
      assert.deepEqual({ ...request.arguments }, { value: 'caption' });
    });
    void it('converts a number parameter for the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        {
          identifier: 'value',
          dataType: 'number',
          title: null,
          allowedLabels: [],
        },
      ];
      await new LoadScenarioAction('scenario', { value: '42' }).apply(
        c.context,
      );
      const request: (typeof c.h.source.calls)[number]['request'] =
        c.h.source.calls[0].request;
      assert.equal(request.type, 'query');
      assert.deepEqual({ ...request.arguments }, { value: 42 });
    });
    void it('converts a json parameter for the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        {
          identifier: 'value',
          dataType: 'json',
          title: null,
          allowedLabels: [],
        },
      ];
      await new LoadScenarioAction('scenario', { value: '{"x":1}' }).apply(
        c.context,
      );
      const request: (typeof c.h.source.calls)[number]['request'] =
        c.h.source.calls[0].request;
      assert.equal(request.type, 'query');
      assert.deepEqual({ ...request.arguments }, { value: { x: 1 } });
    });
    void it('converts a startDateTime parameter for the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        {
          identifier: 'value',
          dataType: 'startDateTime',
          title: null,
          allowedLabels: [],
        },
      ];
      await new LoadScenarioAction('scenario', { value: 'start' }).apply(
        c.context,
      );
      const request: (typeof c.h.source.calls)[number]['request'] =
        c.h.source.calls[0].request;
      assert.equal(request.type, 'query');
      assert.deepEqual({ ...request.arguments }, { value: 'start' });
    });
    void it('converts a endDateTime parameter for the source delegate', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.parameters = [
        {
          identifier: 'value',
          dataType: 'endDateTime',
          title: null,
          allowedLabels: [],
        },
      ];
      await new LoadScenarioAction('scenario', { value: 'end' }).apply(
        c.context,
      );
      const request: (typeof c.h.source.calls)[number]['request'] =
        c.h.source.calls[0].request;
      assert.equal(request.type, 'query');
      assert.deepEqual({ ...request.arguments }, { value: 'end' });
    });
    void it('skips scenario queries without query text', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.queries[0].query = null;
      await new LoadScenarioAction('scenario').apply(c.context);
      assert.equal(c.h.source.calls.length, 0);
    });
    void it('collects the row count when a table query reaches its limit', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.storage.scenario.queries[0].isTableQuery = true;
      c.h.source.response = {
        ...TestHarness.result([], [], true),
        table: [{ value: 1 }, { value: 2 }],
      };
      await new LoadScenarioAction('scenario').apply(c.context);
      assert.deepEqual(c.context.limits, [2]);
      assert.deepEqual(c.context.data.graph.table, [
        { value: 1 },
        { value: 2 },
      ]);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.getNode('a').move({ x: 4, y: 5 });
      const types: (typeof c.h.storage.scenario.parameters)[number]['dataType'][] =
        ['string', 'number', 'json', 'startDateTime', 'endDateTime'];
      c.h.storage.scenario.parameters = types.map(
        (
          type: (typeof types)[number],
        ): (typeof c.h.storage.scenario.parameters)[number] => ({
          identifier: type,
          title: null,
          dataType: type,
          allowedLabels: [],
        }),
      );
      c.h.storage.scenario.queries.push(
        { sourceId: 'source', query: null, isTableQuery: false },
        { sourceId: 'source', query: 'table', isTableQuery: true },
      );
      c.h.storage.scenario.actions = [
        { type: 'setNodeRadius', label: 'Person', radius: 90 },
        { type: 'setNodeRadius', label: 'Person', radius: 100 },
      ];
      c.h.source.response = {
        ...TestHarness.result(
          [TestHarness.node('a'), TestHarness.node('new')],
          [],
          true,
        ),
        table: [{ value: 9 }],
      };
      const args: Record<string, string> = {
        string: 's',
        number: '42',
        json: '{"x":1}',
        startDateTime: 'start',
        endDateTime: 'end',
      };
      const instance: LoadScenarioAction = new LoadScenarioAction(
        'scenario',
        args,
      );
      assert.ok(instance instanceof LoadScenarioAction);
    });
  });
});
