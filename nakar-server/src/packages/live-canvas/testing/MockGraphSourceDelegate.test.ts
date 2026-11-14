import { TestHarness } from './TestHarness.test';
import type { QueryResult } from '../data/QueryResult';
import type { GraphRequest } from '../delegates/GraphRequest';
import type { GraphSourceDelegate } from '../delegates/GraphSourceDelegate';

export class MockGraphSourceDelegate implements GraphSourceDelegate {
  public calls: {
    sourceId: string;

    request: GraphRequest;
  }[] = [];

  public response: QueryResult = TestHarness.result();

  public handler: (() => Promise<QueryResult>) | null = null;

  public execute(
    sourceId: string,
    request: GraphRequest,
  ): Promise<QueryResult> {
    this.calls.push({ sourceId, request: structuredClone(request) });
    return this.handler === null
      ? Promise.resolve(structuredClone(this.response))
      : this.handler();
  }
}
