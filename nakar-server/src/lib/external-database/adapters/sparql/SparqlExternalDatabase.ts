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
import { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import type {
  Bindings,
  Literal,
  Quad,
  Quad_Object,
  Quad_Predicate,
  Quad_Subject,
  Term,
} from '@rdfjs/types';
import toNT from '@rdfjs/to-ntriples';
import { match } from 'ts-pattern';
import type { SparqlLabel } from './SparqlLabel';

export class SparqlExternalDatabase implements ExternalGraphDatabase {
  private readonly _logger: Logger;
  private readonly _queryEngine: QueryEngine = new QueryEngine();

  public constructor() {
    this._logger = createChildLogger(this);
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);

    const myEngine: QueryEngine = this._queryEngine;
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

    this._logger.debug(`Query ${queryId} finished`);

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
      const relationshipParts: string[] = limit.relationships.toArray();
      const hasRelationshipFilter: boolean = relationshipParts.length > 0;

      const labelFilterFunctions: string[] = [];
      for (const label of this._possibleLabels()) {
        if (limit.labels.has(label)) {
          const filterFn: string = match(label)
            .with('NamedNode', (): string => 'isIRI')
            .with('BlankNode', (): string => 'isBlank')
            .with('Literal', (): string => 'isLiteral')
            .exhaustive();
          labelFilterFunctions.push(filterFn);
        }
      }

      const outgoingFilterParts: string[] = [];
      const incomingFilterParts: string[] = [];
      if (hasRelationshipFilter) {
        outgoingFilterParts.push(
          `?allowedPredicate1 IN (${relationshipParts.join(', ')})`,
        );
        incomingFilterParts.push(
          `?allowedPredicate2 IN (${relationshipParts.join(', ')})`,
        );
      }
      for (const fn of labelFilterFunctions) {
        outgoingFilterParts.push(`${fn}(?o1)`);
        incomingFilterParts.push(`${fn}(?o2)`);
      }

      const outgoingFilter: string =
        outgoingFilterParts.length > 0
          ? outgoingFilterParts.join(' || ')
          : 'false';
      const incomingFilter: string =
        incomingFilterParts.length > 0
          ? incomingFilterParts.join(' || ')
          : 'false';

      return await this.executeQuery(
        credentials,
        `
CONSTRUCT {
  ?node ?allowedPredicate1 ?o1 .
  ?o2 ?allowedPredicate2 ?node .
}
WHERE {
  VALUES ?node { ${nodeIds.toArray().join(' ')} }
  {
    ?node ?allowedPredicate1 ?o1 .
    FILTER(${outgoingFilter})
  }
  UNION
  {
    ?o2 ?allowedPredicate2 ?node .
    FILTER(${incomingFilter})
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
    if (nodeIds.size === 0) {
      return ExternalGraphDatabaseExpandNodePreview.empty();
    }

    const [labelDataStream, relsResult]: [BindingsStream, BindingsStream] =
      await Promise.all([
        this.runGenericSparqlQuery(
          credentials,
          `
SELECT
  (SUM(IF(isIRI(?n), 1, 0)) AS ?NamedNode)
  (SUM(IF(isBlank(?n), 1, 0)) AS ?BlankNode)
  (SUM(IF(isLiteral(?n), 1, 0)) AS ?Literal)
WHERE {
  {
    SELECT DISTINCT ?n
    WHERE {
      VALUES ?s { ${nodeIds.toArray().join(' ')} }

      {
        ?s ?p ?n .
      }
      UNION
      {
        ?n ?p ?s .
      }
    }
  }
}
    `,
        ),
        this.runGenericSparqlQuery(
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
        ),
      ]);

    const labelData: Bindings[] = await labelDataStream.toArray();
    const labelResult: ExternalGraphDatabaseExpandNodePreviewEntry[] = [];
    if (labelData.length === 1) {
      const namedNodeCount: number = parseInt(
        labelData[0].get('NamedNode')?.value ?? '0',
      );
      const blankNodeCount: number = parseInt(
        labelData[0].get('BlankNode')?.value ?? '0',
      );
      const literalCount: number = parseInt(
        labelData[0].get('Literal')?.value ?? '0',
      );

      if (namedNodeCount > 0) {
        labelResult.push(
          new ExternalGraphDatabaseExpandNodePreviewEntry({
            identificator: 'NamedNode' satisfies SparqlLabel,
            title: 'NamedNode' satisfies SparqlLabel,
            count: namedNodeCount,
          }),
        );
      }
      if (blankNodeCount > 0) {
        labelResult.push(
          new ExternalGraphDatabaseExpandNodePreviewEntry({
            identificator: 'BlankNode' satisfies SparqlLabel,
            title: 'BlankNode' satisfies SparqlLabel,
            count: blankNodeCount,
          }),
        );
      }
      if (literalCount > 0) {
        labelResult.push(
          new ExternalGraphDatabaseExpandNodePreviewEntry({
            identificator: 'Literal' satisfies SparqlLabel,
            title: 'Literal' satisfies SparqlLabel,
            count: literalCount,
          }),
        );
      }
    }

    const relationshipResults: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      [];
    for await (const bindings of relsResult) {
      const term: Term | null = bindings.get('p') ?? null;
      if (term == null) {
        this._logger.error(
          'Term in expand node preview not found. This should not happen.',
        );
        continue;
      }
      const sparqlRef: string = toNT(term);
      const countTerm: Term | null = bindings.get('count') ?? null;
      if (countTerm == null) {
        this._logger.error(
          'The count term in expand node preview not found. This should not happen.',
        );
        continue;
      }
      const count: number = parseInt(countTerm.value);
      if (isNaN(count)) {
        this._logger.error(
          'The count term in expand node preview is not a number. This should not happen.',
        );
        continue;
      }

      relationshipResults.push(
        new ExternalGraphDatabaseExpandNodePreviewEntry({
          identificator: sparqlRef,
          title: sparqlRef,
          count: count,
        }),
      );
    }

    return new ExternalGraphDatabaseExpandNodePreview(
      labelResult,
      relationshipResults,
    );
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
LIMIT 1
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
LIMIT 1
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

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?n ?p ?neighbor .
  ?neighbor ?p ?n .
}
WHERE {
  VALUES ?n { ${nodeIds.toArray().join(' ')} }
  VALUES ?neighbor { ${neighbors.toArray().join(' ')} }
  {
    ?n ?p ?neighbor .
  }
  UNION
  {
    ?neighbor ?p ?n .
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

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const triplePatterns: string[] = relationshipIds.map(
      (id: string): string => {
        const parts: string[] = id
          .split(':')
          .map((part: string): string => this._decodeBase64(part));
        const s: string = parts[0];
        const p: string = parts[1];
        const o: string = parts[2];
        return `(${s} ${p} ${o})`;
      },
    );

    if (triplePatterns.length === 0) {
      return ExternalGraphDatabaseQueryResult.empty();
    }

    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?s ?p ?o .
}
WHERE {
  VALUES (?s ?p ?o) {
    ${triplePatterns.join('\n    ')}
  }
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

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?source ?p ?target .
}
WHERE {
  VALUES ?source { ${nodeIds.toArray().join(' ')} }
  VALUES ?target { ${nodeIds.toArray().join(' ')} }
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

  public async runGenericSparqlQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
  ): Promise<BindingsStream> {
    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);
    this._logger.debug(
      `Will start SPARQL Query to ${url.toString()} (${queryId}): ${query}`,
    );

    const myEngine: QueryEngine = this._queryEngine;
    const bindingsStream: BindingsStream = await myEngine.queryBindings(query, {
      sources: [url.toString()],
    });

    this._logger.debug(`Did start streaming query response of ${queryId}`);

    bindingsStream.on('end', (): void => {
      this._logger.debug(`Query ${queryId} finished`);
    });

    return bindingsStream;
  }

  private async _loadRelationshipTypes(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStatsRelationship[]> {
    const result: BindingsStream = await this.runGenericSparqlQuery(
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
    const result: BindingsStream = await this.runGenericSparqlQuery(
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
    const fakeNativeId: string = [
      this._encodeBase64(this._getNativeId(subject)),
      this._encodeBase64(this._getNativeId(quadElement)),
      this._encodeBase64(this._getNativeId(object)),
    ].join(':');
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
      const stringValue: string =
        typeof argumentValue === 'string' && this._isSparqlURI(argumentValue)
          ? argumentValue
          : JSON.stringify(argumentValue);
      result = result.replaceAll(`$${argumentName}`, stringValue);
    }
    return result;
  }

  private _isSparqlURI(input: string): boolean {
    if (!input.startsWith('<')) {
      return false;
    }
    if (!input.endsWith('>')) {
      return false;
    }
    try {
      const url: string = input.slice(1, input.length - 1);
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private _getSparqlReferenceLiteralOfNode(
    node: Quad_Subject | Quad_Object,
  ): string {
    return toNT(node);
  }

  private _encodeBase64(input: string): string {
    return Buffer.from(input, 'utf8').toString('base64');
  }

  private _decodeBase64(input: string): string {
    return Buffer.from(input, 'base64').toString('utf8');
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
