import type { Quad } from 'n3';
import { Parser } from 'n3';
import { SSet } from '../../../../packages/set/Set';
import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { SparqlGraphElementsFactory } from './SparqlGraphElementsFactory';

const uriPattern: RegExp = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

export class SparqlExternalDatabase implements ExternalGraphDatabase {
  public static maxHops: number = 5;

  private readonly _logger: Logger;
  private readonly _relationshipMap: SMap<
    string,
    { subject: string; predicate: string; object: string }
  >;

  public constructor() {
    this._logger = createChildLogger(this);
    this._relationshipMap = new SMap();
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const queryWithParams: string = this._replaceParameters(query, parameters);

    const turtle: string = await this._fetchSparql(
      credentials,
      queryWithParams,
      'text/turtle',
    );

    const factory: SparqlGraphElementsFactory = new SparqlGraphElementsFactory(
      limitConfig,
    );

    const parser: Parser = new Parser();
    const quads: Quad[] = parser.parse(turtle);

    for (const quad of quads) {
      if (factory.limitReached) {
        break;
      }
      factory.collectQuad(quad, null, credentials);
    }

    const result: ExternalGraphDatabaseQueryResult = factory.getResult();
    this._registerRelationships(result);
    return result;
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const ids: string[] = [...nodeIds];
    const valuesBlock: string = ids
      .map((id: string): string => `<${id}>`)
      .join(' ');

    const query: string = `
      CONSTRUCT { ?s ?p ?o }
      WHERE {
        VALUES ?s { ${valuesBlock} }
        VALUES ?o { ${valuesBlock} }
        ?s ?p ?o .
      }`;

    return await this.executeQuery(
      credentials,
      query,
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const ids: string[] = [...nodeIds];
    const valuesBlock: string = ids
      .map((id: string): string => `<${id}>`)
      .join(' ');

    let filterClauses: string = '';
    if (limit) {
      const relFilter: string =
        limit.relationships.size > 0
          ? `?p IN (${[...limit.relationships].map((r: string): string => `<${r}>`).join(', ')})`
          : '';
      const labelFilter: string =
        limit.labels.size > 0
          ? `?neighborType IN (${[...limit.labels].map((l: string): string => `<${l}>`).join(', ')})`
          : '';

      const filters: string[] = [];
      if (relFilter) {
        filters.push(relFilter);
      }
      if (labelFilter) {
        filters.push(labelFilter);
      }
      if (filters.length > 0) {
        filterClauses = `FILTER(${filters.join(' && ')})`;
      }
    }

    const query: string = `
      CONSTRUCT { ?center ?p ?neighbor }
      WHERE {
        VALUES ?center { ${valuesBlock} }
        {
          ?center ?p ?neighbor .
          FILTER(isIRI(?neighbor))
        }
        UNION
        {
          ?neighbor ?p ?center .
          FILTER(isIRI(?neighbor))
        }
        ${filterClauses}
      }`;

    const limitConfig: ExternalGraphDatabaseQueryLimitConfig = limit
      ? new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements')
      : new ExternalGraphDatabaseQueryLimitConfig('preview', 'graphElements');

    return await this.executeQuery(credentials, query, {}, limitConfig);
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const ids: string[] = [...nodeIds];
    const valuesBlock: string = ids
      .map((id: string): string => `<${id}>`)
      .join(' ');

    const relTypeQuery: string = `
      SELECT ?p (COUNT(*) AS ?c)
      WHERE {
        VALUES ?center { ${valuesBlock} }
        {
          ?center ?p ?o .
          FILTER(isIRI(?o))
        }
        UNION
        {
          ?s ?p ?center .
          FILTER(isIRI(?s))
        }
      }
      GROUP BY ?p
      ORDER BY DESC(?c)`;

    const relJson: string = await this._fetchSparql(
      credentials,
      relTypeQuery,
      'application/sparql-results+json',
    );
    const relBindings: Record<string, { type: string; value: string }>[] =
      this._parseSparqlJsonBindings(relJson);

    const relationships: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      relBindings.map(
        (
          binding: Record<string, { type: string; value: string }>,
        ): ExternalGraphDatabaseExpandNodePreviewEntry =>
          new ExternalGraphDatabaseExpandNodePreviewEntry(
            binding['p'].value,
            Number(binding['c'].value),
          ),
      );

    const labelQuery: string = `
      SELECT ?typeLabel (COUNT(*) AS ?c)
      WHERE {
        VALUES ?center { ${valuesBlock} }
        ?center a ?typeLabel .
      }
      GROUP BY ?typeLabel
      ORDER BY DESC(?c)`;

    const labelJson: string = await this._fetchSparql(
      credentials,
      labelQuery,
      'application/sparql-results+json',
    );
    const labelBindings: Record<string, { type: string; value: string }>[] =
      this._parseSparqlJsonBindings(labelJson);

    const labels: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      labelBindings.map(
        (
          binding: Record<string, { type: string; value: string }>,
        ): ExternalGraphDatabaseExpandNodePreviewEntry =>
          new ExternalGraphDatabaseExpandNodePreviewEntry(
            binding['typeLabel'].value,
            Number(binding['c'].value),
          ),
      );

    return new ExternalGraphDatabaseExpandNodePreview(labels, relationships);
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    void credentials;
    await Promise.resolve();
    return {
      relTypeCount: 0,
      labelCount: 0,
      relCount: 0,
      nodeCount: 0,
      labels: [],
      rels: [],
    };
  }

  public async getSearchCapabilities(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseSearchCapabilities> {
    void credentials;
    await Promise.resolve();
    return {
      canExactMatchNativeId: true,
      canExactMatchLabel: false,
      exactMatchNodeProperties: new SMap(),
      fuzzyMatchNodeProperties: new SMap(),
    };
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    const result: ExternalGraphDatabaseQueryResult =
      await this.findNodeByNativeId(credentials, searchTerm);
    return result.nodes.toValueArray();
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const query: string = `
      CONSTRUCT { ?s ?p ?o }
      WHERE {
        VALUES ?s { <${nativeNodeId}> }
        ?s ?p ?o .
      }`;

    return await this.executeQuery(
      credentials,
      query,
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: string[],
    neighbors: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const nodeValues: string = nodeIds
      .map((id: string): string => `<${id}>`)
      .join(' ');
    const neighborValues: string = neighbors
      .map((id: string): string => `<${id}>`)
      .join(' ');

    const query: string = `
      CONSTRUCT { ?n ?p ?neighbor }
      WHERE {
        VALUES ?n { ${nodeValues} }
        VALUES ?neighbor { ${neighborValues} }
        {
          ?n ?p ?neighbor .
        }
        UNION
        {
          ?neighbor ?p ?n .
        }
      }`;

    return await this.executeQuery(
      credentials,
      query,
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const triples: { subject: string; predicate: string; object: string }[] =
      [];

    for (const id of relationshipIds) {
      const triple:
        | { subject: string; predicate: string; object: string }
        | undefined = this._relationshipMap.get(id);
      if (triple) {
        triples.push(triple);
      }
    }

    if (triples.length === 0) {
      const empty: SMap<string, ExternalGraphDatabaseNode> = new SMap<
        string,
        ExternalGraphDatabaseNode
      >();
      return new ExternalGraphDatabaseQueryResult(empty, new SMap(), [], false);
    }

    const valuesBlock: string = triples
      .map(
        (t: { subject: string; predicate: string; object: string }): string =>
          `( <${t.subject}> <${t.predicate}> <${t.object}> )`,
      )
      .join(' ');

    const query: string = `
      CONSTRUCT { ?s ?p ?o }
      WHERE {
        VALUES (?s ?p ?o) { ${valuesBlock} }
        ?s ?p ?o .
      }`;

    return await this.executeQuery(
      credentials,
      query,
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nativeIdA: string,
    nativeIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const allQuads: Quad[] = [];
    const visited: SSet<string> = new SSet<string>([nativeIdA]);
    let frontier: string[] = [nativeIdA];
    let depth: number = 0;

    while (frontier.length > 0 && depth < SparqlExternalDatabase.maxHops) {
      const frontierValues: string = frontier
        .map((id: string): string => `<${id}>`)
        .join(' ');

      const query: string = `
        CONSTRUCT { ?mid ?p ?o }
        WHERE {
          VALUES ?mid { ${frontierValues} }
          {
            ?mid ?p ?o .
            FILTER(isIRI(?o))
          }
          UNION
          {
            ?s ?p ?mid .
            FILTER(isIRI(?s))
          }
        }`;

      const turtle: string = await this._fetchSparql(
        credentials,
        query,
        'text/turtle',
      );

      const parser: Parser = new Parser();
      const quads: Quad[] = parser.parse(turtle);
      allQuads.push(...quads);

      const neighbors: SSet<string> = new SSet<string>();
      for (const quad of quads) {
        if (
          quad.object.termType === 'NamedNode' ||
          quad.object.termType === 'BlankNode'
        ) {
          const objUri: string = quad.object.value;
          if (!visited.has(objUri)) {
            neighbors.add(objUri);
          }
          if (objUri === nativeIdB) {
            return this._quadsToResult(allQuads, credentials);
          }
        }
        if (
          quad.subject.termType === 'NamedNode' ||
          quad.subject.termType === 'BlankNode'
        ) {
          const subjUri: string = quad.subject.value;
          if (frontier.includes(subjUri)) {
            const objUri: string =
              quad.object.termType === 'NamedNode' ||
              quad.object.termType === 'BlankNode'
                ? quad.object.value
                : '';
            if (objUri && !visited.has(objUri)) {
              neighbors.add(objUri);
            }
            if (objUri === nativeIdB) {
              return this._quadsToResult(allQuads, credentials);
            }
          }
        }
      }

      for (const n of neighbors) {
        visited.add(n);
      }
      frontier = [...neighbors];
      depth++;
    }

    return this._quadsToResult(allQuads, credentials);
  }

  public async shutdown(): Promise<void> {
    this._logger.info('Shutting down SPARQL adapter (no-op).');
    await Promise.resolve();
  }

  private async _fetchSparql(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    accept: string,
  ): Promise<string> {
    const url: string = credentials.connectionUrl ?? '';
    if (!url) {
      throw new Error('No SPARQL endpoint URL provided in connectionUrl.');
    }

    this._logger.debug(`SPARQL query: ${query.slice(0, 500)}`);

    const headers: Record<string, string> = {
      Accept: accept,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (
      credentials.username != null &&
      credentials.password != null &&
      credentials.username !== '' &&
      credentials.password !== ''
    ) {
      const encoded: string = Buffer.from(
        `${credentials.username}:${credentials.password}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    const response: Response = await fetch(url, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ query }),
    });

    if (!response.ok) {
      const body: string = await response.text();
      throw new Error(
        `SPARQL endpoint returned ${response.status.toString()}: ${body.slice(0, 1000)}`,
      );
    }

    return await response.text();
  }

  private _replaceParameters(
    query: string,
    parameters: Record<string, unknown>,
  ): string {
    return query.replace(
      /\{\{\{(\w+)\}\}\}/g,
      (match: string, varName: string): string => {
        void match;
        const value: unknown = parameters[varName];
        if (value === undefined || value === null) {
          throw new Error(`Missing SPARQL parameter: ${varName}`);
        }
        return this._formatSparqlValue(value);
      },
    );
  }

  private _formatSparqlValue(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    const str: string = String(value);
    if (uriPattern.test(str)) {
      return `<${str}>`;
    }
    const escaped: string = str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"""${escaped}"""`;
  }

  private _parseSparqlJsonBindings(
    jsonString: string,
  ): Record<string, { type: string; value: string }>[] {
    try {
      const raw: unknown = JSON.parse(jsonString);
      /* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
      const parsed: {
        results?: {
          bindings?: Record<string, { type: string; value: string }>[];
        };
      } = raw as {
        results?: {
          bindings?: Record<string, { type: string; value: string }>[];
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
      return parsed.results?.bindings ?? [];
    } catch (error: unknown) {
      this._logger.error('Failed to parse SPARQL JSON results', error);
      return [];
    }
  }

  private _registerRelationships(
    result: ExternalGraphDatabaseQueryResult,
  ): void {
    for (const [id, rel] of result.relationships) {
      this._relationshipMap.set(id, {
        subject: rel.startNodeId,
        predicate: rel.type,
        object: rel.endNodeId,
      });
    }
  }

  private _quadsToResult(
    quads: Quad[],
    credentials: ExternalGraphDatabaseCredentials,
  ): ExternalGraphDatabaseQueryResult {
    const factory: SparqlGraphElementsFactory = new SparqlGraphElementsFactory(
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );

    for (const quad of quads) {
      if (factory.limitReached) {
        break;
      }
      factory.collectQuad(quad, null, credentials);
    }

    const result: ExternalGraphDatabaseQueryResult = factory.getResult();
    this._registerRelationships(result);
    return result;
  }
}
