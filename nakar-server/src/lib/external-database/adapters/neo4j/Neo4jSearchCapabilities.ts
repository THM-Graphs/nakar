import type { SMap } from '../../../../packages/map/Map';
import type { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';

export class Neo4jSearchCapabilities implements ExternalGraphDatabaseSearchCapabilities {
  public readonly canExactMatchElementId: boolean = true;

  // eslint-disable-next-line @typescript-eslint/no-unused-private-class-members
  private readonly _canExactMatchLabel: boolean;
  private readonly _exactMatchNodeProperties: SMap<string, SSet<string>>;
  private readonly _fuzzyMatchNodeProperties: SMap<string, SSet<string>>;

  public constructor(params: {
    canExactMatchLabel: boolean;
    exactMatchNodeProperties: SMap<string, SSet<string>>;
    fuzzyMatchNodeProperties: SMap<string, SSet<string>>;
  }) {
    this._canExactMatchLabel = params.canExactMatchLabel;
    this._exactMatchNodeProperties = params.exactMatchNodeProperties;
    this._fuzzyMatchNodeProperties = params.fuzzyMatchNodeProperties;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get canExactMatchLabel(): boolean {
    return false;
  }

  public get exactMatchNodeProperties(): SMap<string, SSet<string>> {
    return this._exactMatchNodeProperties;
  }

  public get fuzzyMatchNodeProperties(): SMap<string, SSet<string>> {
    return this._fuzzyMatchNodeProperties;
  }
}
