import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import { SparqlExternalDatabase } from '../sparql/SparqlExternalDatabase';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import type { BindingsStream } from '@comunica/types';
import type { Term } from '@rdfjs/types';
import toNT from '@rdfjs/to-ntriples';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';

export class WikidataExternalDatabase implements ExternalGraphDatabase {
  private readonly _sparqlAdapter: SparqlExternalDatabase;
  private readonly _logger: Logger = createChildLogger(this);

  public constructor() {
    this._sparqlAdapter = new SparqlExternalDatabase();
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.executeQuery(
        credentials,
        query,
        queryArguments,
        limitConfig,
      );
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.loadConnectingRelationships(
        credentials,
        nodeIds,
      );
    await this._applyTitleToQueryResult(result, credentials);
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
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.expandNode(credentials, nodeIds, limit);
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const result: ExternalGraphDatabaseExpandNodePreview =
      await this._sparqlAdapter.expandNodePreview(credentials, nodeIds);
    const nodeUrisToResolveTitle: SSet<string> = new SSet<string>(
      result.relationships.map(
        (r: ExternalGraphDatabaseExpandNodePreviewEntry): string =>
          r.identificator,
      ),
    );
    const resolvedTitles: SMap<string, string> = await this._resolveNodeTitles(
      nodeUrisToResolveTitle,
      credentials,
    );
    for (const entry of result.relationships) {
      const title: string | null =
        resolvedTitles.get(entry.identificator) ?? null;
      if (title != null) {
        entry.title = title;
      }
    }

    return result;
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    return await this._sparqlAdapter.getStats(credentials);
  }

  public async getSearchCapabilities(): Promise<ExternalGraphDatabaseSearchCapabilities> {
    return await this._sparqlAdapter.getSearchCapabilities();
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    const result: ExternalGraphDatabaseNode[] =
      await this._sparqlAdapter.search(credentials, searchTerm);

    await this._applyNodeTitlesToElementArray(result, credentials);

    return result;
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.findNodeByNativeId(credentials, nativeNodeId);
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.expandClusterNode(
        credentials,
        nodeIds,
        neighbors,
      );
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.findRelationshipsByIds(
        credentials,
        relationshipIds,
      );
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult =
      await this._sparqlAdapter.findShortestPath(credentials, nodeIds);
    await this._applyTitleToQueryResult(result, credentials);
    return result;
  }

  public async shutdown(): Promise<void> {
    await this._sparqlAdapter.shutdown();
  }

  private async _resolveNodeTitles(
    nodeUris: SSet<string>,
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<SMap<string, string>> {
    if (nodeUris.size === 0) {
      return new SMap();
    }

    const configuredLanguage: string | null =
      credentials.language?.trim() ?? null;
    if (configuredLanguage == null || configuredLanguage.length === 0) {
      this._logger.warn("No language configured. Will fallback to 'en'.");
    }
    const language: string = configuredLanguage ?? 'en';

    const bindingsStream: BindingsStream =
      await this._sparqlAdapter.runGenericSparqlQuery(
        credentials,
        `
SELECT ?input ?inputLabel
WHERE {
  VALUES ?input { ${nodeUris.toArray().join(' ')} }
  
  {
    ?input <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(?label AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#claim> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Claim)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#directClaim> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, "") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#directClaimNormalized> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Normalized)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#statementProperty> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Statement Property)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#statementValueNormalized> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Statement Value Normalized)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#reference> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Reference)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#qualifier> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Qualifier)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#statementValue> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Statement Value)") AS ?inputLabel)
  }
  
  FILTER(LANG(?label) IN (${JSON.stringify(language)}, "mul", "en"))
  BIND(LANG(?label) AS ?lang)
}
  
ORDER BY DESC (
  IF(LANG(?label) = ${JSON.stringify(language)}, 1,
    IF(LANG(?label) = "mul", 2,
      IF(LANG(?label) = "en", 3, 4)
    )
  )
)
    `,
      );

    const result: SMap<string, string> = new SMap<string, string>();

    for await (const entry of bindingsStream) {
      const uriTerm: Term | null = entry.get('input') ?? null;
      const uri: string | null = uriTerm == null ? null : toNT(uriTerm);
      const title: string | null = entry.get('inputLabel')?.value ?? null;
      if (uri != null && title != null) {
        result.set(uri, title);
      }
    }

    return result;
  }

  private async _applyTitleToQueryResult(
    result: ExternalGraphDatabaseQueryResult,
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<void> {
    await this._applyNodeTitlesToElementArray(
      [...result.nodes.toValueArray(), ...result.relationships.toValueArray()],
      credentials,
    );
  }

  private async _applyNodeTitlesToElementArray(
    nodes: (ExternalGraphDatabaseNode | ExternalGraphDatabaseRelationship)[],
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<void> {
    const resolvedNodeTitles: SMap<string, string> =
      await this._resolveNodeTitles(
        new SSet(
          nodes.map(
            (
              n: ExternalGraphDatabaseNode | ExternalGraphDatabaseRelationship,
            ): string =>
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              n.properties['sparql'] as string,
          ),
        ),
        credentials,
      );
    for (const entry of nodes) {
      const title: string | null =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        resolvedNodeTitles.get(entry.properties['sparql'] as string) ?? null;
      if (title != null) {
        if ('type' in entry) {
          // Relationship
          entry.type = title;
        } else {
          // Node
          entry.properties['label'] = title;
        }
      }
    }
  }
}
