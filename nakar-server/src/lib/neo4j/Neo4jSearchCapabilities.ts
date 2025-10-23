import type { SMap } from '../tools/Map';
import type { SSet } from '../tools/Set';

export class Neo4jSearchCapabilities {
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

  // Token lookup indexes: only solves node label and relationship type predicates
  public get canExactMatchLabel(): boolean {
    return this._canExactMatchLabel;
  }

  // Range indexes: Neo4j’s default index. Supports most types of predicates.
  public get exactMatchNodeProperties(): SMap<string, SSet<string>> {
    return this._exactMatchNodeProperties;
  }

  // Text indexes: solves predicates operating on STRING values. Optimized for queries filtering with the STRING operators CONTAINS and ENDS WITH.
  public get fuzzyMatchNodeProperties(): SMap<string, SSet<string>> {
    return this._fuzzyMatchNodeProperties;
  }
}
