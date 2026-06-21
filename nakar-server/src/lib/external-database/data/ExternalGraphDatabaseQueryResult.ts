import type { SMap } from '../../../packages/map/Map';
import type { ExternalGraphDatabaseNode } from './ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseRelationship } from './ExternalGraphDatabaseRelationship';

export class ExternalGraphDatabaseQueryResult {
  public constructor(
    public readonly nodes: SMap<string, ExternalGraphDatabaseNode>,
    public readonly relationships: SMap<
      string,
      ExternalGraphDatabaseRelationship
    >,
    public readonly tableData: SMap<string, unknown>[],
    private readonly _limitReached: boolean,
  ) {}

  public get limitReached(): boolean {
    return this._limitReached;
  }

  public get size(): number {
    return this.nodes.size + this.relationships.size + this.tableData.length;
  }
}
