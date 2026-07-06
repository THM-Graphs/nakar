import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { SSet } from '../../../../packages/set/Set';
import { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseStatsRelationship } from '../../data/ExternalGraphDatabaseStatsRelationship';
import { QueryEngine } from '@comunica/query-sparql';
import type { BindingsStream } from '@comunica/types';
import { v4 } from 'uuid';
import type { AsyncIterator } from 'asynciterator';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';
import { ExternalGraphDatabaseQueryLimitConfigType } from '../../data/ExternalGraphDatabaseQueryLimitConfigType';
import { ExternalGraphDatabaseQueryLimitConfigCollectionType } from '../../data/ExternalGraphDatabaseQueryLimitConfigCollectionType';
import type { ExternalGraphDatabaseStatsLabel } from '../../data/ExternalGraphDatabaseStatsLabel';
import type { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import type {
  Bindings,
  Literal,
  Quad,
  Quad_Object,
  Quad_Predicate,
  Quad_Subject,
} from '@rdfjs/types';
import toNT from '@rdfjs/to-ntriples';
import { match } from 'ts-pattern';
import { createHash } from 'crypto';
import type { SparqlLabel } from './SparqlLabel';

export class SparqlExternalDatabase implements ExternalGraphDatabase {
  private readonly _logger: Logger;

  public constructor() {
    this._logger = createChildLogger(this);
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    // TODO: Parameters

    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);

    const myEngine: QueryEngine = new QueryEngine();
    const queryWithArguments: string = this._applyParametersToQuery(
      query,
      queryArguments,
    );

    this._logger.debug(`***** Will start SPARQL Query to ${url.toString()}`);
    this._logger.debug('Query ID:');
    this._logger.debug(queryId);
    this._logger.debug('Arguments:');
    this._logger.debug(JSON.stringify(queryArguments));
    this._logger.debug('Raw Query:');
    this._logger.debug(query);
    this._logger.debug('Bound Query:');
    this._logger.debug(queryWithArguments);
    this._logger.debug('*****');

    const bindingsStream: AsyncIterator<Quad> = await myEngine.queryQuads(
      queryWithArguments,
      {
        sources: [url.toString()],
      },
    );

    this._logger.debug(`Did start streaming query response of ${queryId}`);

    bindingsStream.on('error', (error: unknown): void => {
      this._logger.error(error);
    });
    bindingsStream.on('end', (): void => {
      this._logger.debug(`Query ${queryId} finished`);
    });

    const limit: number = limitConfig.getLimit();

    const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
      string,
      ExternalGraphDatabaseNode
    >();
    const relationships: SMap<string, ExternalGraphDatabaseRelationship> =
      new SMap<string, ExternalGraphDatabaseRelationship>();

    for await (const quad of bindingsStream) {
      this._collectNode(quad.subject, 'Subject', nodes, credentials);
      this._collectNode(quad.object, 'Object', nodes, credentials);
      this._collectRelationship(
        quad.subject,
        quad.object,
        quad.predicate,
        relationships,
        credentials,
      );

      if (nodes.size + relationships.size >= limit) {
        break;
      }
    }

    return new ExternalGraphDatabaseQueryResult(
      nodes,
      relationships,
      [],
      nodes.size + relationships.size >= limit,
    );
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const uriList: string = nodeIds.toArray().join(' ');
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  VALUES ?s { ${uriList} }
  VALUES ?o { ${uriList} }

  ?s ?p ?o .
}
    `,
      {},
      new ExternalGraphDatabaseQueryLimitConfig(
        ExternalGraphDatabaseQueryLimitConfigType.default,
        ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
      ),
    );
    return result;
  }

  public async expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    if (limit == null) {
      return await this.executeQuery(
        credentials,
        `
CONSTRUCT {
  ?node ?p1 ?o1 .
  ?o2 ?p2 ?node .
}
WHERE {
  VALUES ?node { ${nodeIds.toArray().join(' ')} }
  {
    ?node ?p1 ?o1 .
  }
  UNION
  {
    ?o2 ?p2 ?node .
  }
}   
    `,
        {},
        new ExternalGraphDatabaseQueryLimitConfig(
          ExternalGraphDatabaseQueryLimitConfigType.preview,
          ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
        ),
      );
    } else {
      return await this.executeQuery(
        credentials,
        `
CONSTRUCT {
  ?node ?allowedPredicate1 ?o1 .
  ?o2 ?allowedPredicate2 ?node .
}
WHERE {
  VALUES ?node { ${nodeIds.toArray().join(' ')} }
  VALUES ?allowedPredicate1 { ${limit.relationships
    .toArray()
    .map((rel: string): string => `<${rel}>`)
    .join(' ')} }
  VALUES ?allowedPredicate2 { ${limit.relationships
    .toArray()
    .map((rel: string): string => `<${rel}>`)
    .join(' ')} }
  {
    ?node ?allowedPredicate1 ?o1 .
  }
  UNION
  {
    ?o2 ?allowedPredicate2 ?node .
  }
}    
    `,
        {},
        new ExternalGraphDatabaseQueryLimitConfig(
          ExternalGraphDatabaseQueryLimitConfigType.default,
          ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
        ),
      );
    }
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const relsResult: BindingsStream = await this._runGenericSparqlQuery(
      credentials,
      `
SELECT ?p (COUNT(DISTINCT *) AS ?count)
WHERE {
  VALUES ?s { ${nodeIds.toArray().join(' ')} }
  {
    ?s ?p ?o .
  }
  UNION
  {
    ?o ?p ?s .
  }
}
GROUP BY ?p
ORDER BY DESC(?count)
    `,
    );
    const relationshipResults: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      [];
    for await (const bindings of relsResult) {
      relationshipResults.push({
        identificator: bindings.get('p')?.value ?? '',
        count: parseInt(bindings.get('count')?.value ?? '0'),
      });
    }

    return new ExternalGraphDatabaseExpandNodePreview([], relationshipResults);
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    const [relationshipTypes, relationshipCount]: [
      ExternalGraphDatabaseStatsRelationship[],
      number,
    ] = await Promise.all([
      this._loadRelationshipTypes(credentials),
      this._loadRelationshipsCount(credentials),
    ]);
    const labels: ExternalGraphDatabaseStatsLabel[] =
      this._possibleLabels().map(
        (label: SparqlLabel): ExternalGraphDatabaseStatsLabel => ({
          label: label,
          exploreQuery: this._getExploreQueryForLabel(label),
        }),
      );

    return {
      relTypeCount: relationshipTypes.length,
      labelCount: labels.length,
      relCount: relationshipCount,
      nodeCount: null, // TODO
      labels: labels,
      rels: relationshipTypes,
    };
  }

  public async getSearchCapabilities(): Promise<ExternalGraphDatabaseSearchCapabilities> {
    // TODO
    return await Promise.resolve({
      canExactMatchNativeId: true,
      canExactMatchLabel: false,
      exactMatchNodeProperties: new SMap(),
      fuzzyMatchNodeProperties: new SMap(),
    });
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    let url: URL;
    try {
      url = new URL(searchTerm);
    } catch {
      return [];
    }

    const uri: string = url.toString();

    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?node ?p ?o .
  ?s ?p ?node .
}
WHERE {
  VALUES ?node { <${uri}> }
  {
    ?node ?p ?o .
  }
  UNION
  {
    ?s ?p ?node .
  }
}
      `,
      {},
      new ExternalGraphDatabaseQueryLimitConfig(
        ExternalGraphDatabaseQueryLimitConfigType.preview,
        ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
      ),
    );

    const node: ExternalGraphDatabaseNode | undefined = result.nodes.get(
      `<${uri}>`,
    );

    return node != null ? [node] : [];
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?node ?p ?o .
  ?s ?p ?node .
}
WHERE {
  VALUES ?node { ${nativeNodeId} }
  {
    ?node ?p ?o .
  }
  UNION
  {
    ?s ?p ?node .
  }
}
      `,
      {},
      new ExternalGraphDatabaseQueryLimitConfig(
        ExternalGraphDatabaseQueryLimitConfigType.default,
        ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
      ),
    );

    const node: ExternalGraphDatabaseNode | undefined =
      result.nodes.get(nativeNodeId);

    if (node == null) {
      return ExternalGraphDatabaseQueryResult.empty();
    }

    const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
      string,
      ExternalGraphDatabaseNode
    >();
    nodes.set(nativeNodeId, node);

    return new ExternalGraphDatabaseQueryResult(nodes, new SMap(), [], false);
  }

  public expandClusterNode(): Promise<ExternalGraphDatabaseQueryResult> {
    // TODO
    throw new Error('Cannot expand node clusters in sparql-based databases.');
  }

  public findRelationshipsByIds(): Promise<ExternalGraphDatabaseQueryResult> {
    // TODO
    throw new Error(
      'Cannot find relationship by id in sparql-based databases.',
    );
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    startNodeIds: SSet<string>,
    endNodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?source ?p ?target .
}
WHERE {
  VALUES ?source { ${startNodeIds.toArray().join(' ')} }
  VALUES ?target { ${endNodeIds.toArray().join(' ')} }
  FILTER(?source != ?target)

  ?source ?p ?target .
}
`,
      {},
      new ExternalGraphDatabaseQueryLimitConfig(
        ExternalGraphDatabaseQueryLimitConfigType.default,
        ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
      ),
    );

    return result;
  }

  public async shutdown(): Promise<void> {
    this._logger.info('Shutting down SPARQL adapter (no-op).');
    await Promise.resolve();
  }

  private async _loadRelationshipTypes(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStatsRelationship[]> {
    const result: BindingsStream = await this._runGenericSparqlQuery(
      credentials,
      `SELECT DISTINCT ?p
WHERE {
  ?s ?p ?o .
}
ORDER BY ?p`,
    );

    const relationshipTypes: ExternalGraphDatabaseStatsRelationship[] = [];

    for await (const bindings of result) {
      const value: string | null = bindings.get('p')?.value ?? null;
      if (value != null) {
        relationshipTypes.push({
          relType: value,
          exploreQuery: `CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  VALUES ?p {
    <${value}>
  }
  ?s ?p ?o .
}
LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements}`,
        });
      }
    }

    return relationshipTypes;
  }

  private async _loadRelationshipsCount(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<number> {
    const result: BindingsStream = await this._runGenericSparqlQuery(
      credentials,
      `
SELECT (COUNT(*) AS ?count)
WHERE {
  ?s ?p ?o .
}`,
    );

    const bindings: Bindings[] = await result.toArray();
    if (bindings.length !== 1) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result array length is not 1.',
      );
      return 0;
    }

    const stringValue: string | null = bindings[0].get('count')?.value ?? null;
    if (stringValue == null) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result does not contain the target binding.',
      );
      return 0;
    }

    const numberValue: number = parseInt(stringValue);
    if (isNaN(numberValue)) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result is not a number.',
      );
      return 0;
    }

    return numberValue;
  }

  private async _runGenericSparqlQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
  ): Promise<BindingsStream> {
    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);
    this._logger.debug(
      `Will start SPARQL Query to ${url.toString()} (${queryId}): ${query}`,
    );

    const myEngine: QueryEngine = new QueryEngine();
    const bindingsStream: BindingsStream = await myEngine.queryBindings(query, {
      sources: [url.toString()],
    });

    this._logger.debug(`Did start streaming query response of ${queryId}`);

    bindingsStream.on('error', (error: unknown): void => {
      this._logger.error(error);
    });
    bindingsStream.on('end', (): void => {
      this._logger.debug(`Query ${queryId} finished`);
    });

    return bindingsStream;
  }

  private _assertConnectionUrl(
    credentials: ExternalGraphDatabaseCredentials,
  ): URL {
    if (credentials.connectionUrl == null) {
      throw new Error('Connection URL is empty.');
    }
    const url: URL = new URL(credentials.connectionUrl);
    return url;
  }

  private _possibleLabels(): SparqlLabel[] {
    return ['NamedNode', 'BlankNode', 'Literal'];
  }

  private _collectNode(
    quadElement: Quad_Subject | Quad_Object,
    key: 'Subject' | 'Object',
    nodes: SMap<string, ExternalGraphDatabaseNode>,
    credentials: ExternalGraphDatabaseCredentials,
  ): void {
    const nativeId: string = this._getNativeId(quadElement);
    const existingSubjectNode: ExternalGraphDatabaseNode = nodes.get(
      nativeId,
    ) ?? {
      labels: [quadElement.termType],
      keys: new SSet([]),
      nativeId: nativeId,
      properties: this._collectProperties(quadElement),
      source: credentials,
    };
    nodes.set(nativeId, existingSubjectNode);
    existingSubjectNode.keys.add(key);
  }

  private _collectRelationship(
    subject: Quad_Subject,
    object: Quad_Object,
    quadElement: Quad_Predicate,
    relationships: SMap<string, ExternalGraphDatabaseRelationship>,
    credentials: ExternalGraphDatabaseCredentials,
  ): void {
    const fakeNativeId: string = this._md5(
      `${this._getNativeId(subject)}_${this._getNativeId(quadElement)}_${this._getNativeId(object)}`,
    );
    const existingPredicateNode: ExternalGraphDatabaseRelationship | null =
      relationships.get(fakeNativeId) ?? null;
    if (existingPredicateNode == null) {
      relationships.set(fakeNativeId, {
        keys: new SSet(['Predicate']),
        nativeId: fakeNativeId,
        properties: this._collectProperties(quadElement),
        source: credentials,
        startNodeId: this._getNativeId(subject),
        endNodeId: this._getNativeId(object),
        type: quadElement.value,
      });
    } else {
      existingPredicateNode.keys.add('Predicate');
    }
  }

  private _collectProperties(
    element: Quad_Subject | Quad_Object | Quad_Predicate,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      termType: element.termType,
      value: element.value,
      sparql: this._getSparqlReferenceLiteralOfNode(element),
      ...match(element)
        .returnType<Record<string, unknown>>()
        .with(
          { termType: 'Literal' },
          (literal: Literal): Record<string, unknown> => ({
            language: literal.language,
            direction: literal.direction,
            dataType: literal.datatype.value,
          }),
        )
        .with({ termType: 'NamedNode' }, (): Record<string, unknown> => ({}))
        .with({ termType: 'Quad' }, (): Record<string, unknown> => ({}))
        .with({ termType: 'BlankNode' }, (): Record<string, unknown> => ({}))
        .with({ termType: 'Variable' }, (): Record<string, unknown> => ({}))
        .exhaustive(),
    };

    return result;
  }

  private _applyParametersToQuery(
    query: string,
    queryArguments: Record<string, unknown>,
  ): string {
    let result: string = query;
    for (const [argumentName, argumentValue] of Object.entries(
      queryArguments,
    )) {
      const stringValue: string = JSON.stringify(argumentValue);
      result = result.replaceAll(`$${argumentName}`, stringValue);
    }
    return result;
  }

  private _getSparqlReferenceLiteralOfNode(
    node: Quad_Subject | Quad_Object,
  ): string {
    return toNT(node);
  }

  private _md5(input: string): string {
    return createHash('md5').update(input, 'utf8').digest('hex');
  }

  private _getNativeId(
    node: Quad_Subject | Quad_Predicate | Quad_Object,
  ): string {
    const nativeId: string = this._getSparqlReferenceLiteralOfNode(node);
    return nativeId;
  }

  private _getExploreQueryForLabel(label: SparqlLabel): string {
    return match(label)
      .with(
        'Literal',
        (): string => `CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  ?s ?p ?o .
  FILTER(isLiteral(?o))
}
LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()}`,
      )
      .with(
        'NamedNode',
        (): string => `CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  ?s ?p ?o .
  FILTER(isIRI(?s) || isIRI(?o))
}
LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()}`,
      )
      .with(
        'BlankNode',
        (): string => `CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  ?s ?p ?o .
  FILTER(isBlank(?s) || isBlank(?o))
}
LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()}`,
      )
      .exhaustive();
  }
}
