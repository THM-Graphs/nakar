import type { LiveCanvasArgument } from '../../../live-canvas/graph/LiveCanvasArgument';
import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import { SparqlExternalDatabase } from '../sparql/SparqlExternalDatabase';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import type { BindingsStream } from '@comunica/types';
import type { Term } from '@rdfjs/types';
import toNT from '@rdfjs/to-ntriples';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';

export class WikidataExternalDatabase extends SparqlExternalDatabase {
  public constructor() {
    super((node: ExternalGraphDatabaseNode): void => {
      const url: URL | null = URL.parse(node.nativeId.slice(1, -1));
      const qid: string | undefined = url?.pathname.split('/').at(-1);
      if (qid == null || qid.length === 0) {
        return;
      }
      node.properties['qid'] = qid;
    });
  }

  public override async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: LiveCanvasArgument[],
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._executeQuery(
          credentials,
          query,
          queryArguments,
          limitConfig,
        );
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._loadConnectingRelationships(credentials, nodeIds);
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult = await super._expandNode(
        credentials,
        nodeIds,
        limit,
      );
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    try {
      const result: ExternalGraphDatabaseExpandNodePreview =
        await super._expandNodePreview(credentials, nodeIds);
      const nodeUrisToResolveTitle: SSet<string> = new SSet<string>(
        result.relationships.map(
          (r: ExternalGraphDatabaseExpandNodePreviewEntry): string =>
            r.identificator,
        ),
      );
      const resolvedTitles: SMap<string, string> =
        await this._resolveNodeTitles(nodeUrisToResolveTitle, credentials);
      for (const entry of result.relationships) {
        const title: string | null =
          resolvedTitles.get(entry.identificator) ?? null;
        if (title != null) {
          entry.title = title;
        }
      }

      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async getSearchCapabilities(): Promise<ExternalGraphDatabaseSearchCapabilities> {
    try {
      const base: ExternalGraphDatabaseSearchCapabilities =
        await super._getSearchCapabilities();
      base.special.add('Q-ID');
      return base;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    try {
      let url: URL | null = null;
      try {
        url = new URL(searchTerm);
      } catch {
        /* ok */
      }

      const bindingsStream: BindingsStream = await super._runGenericSparqlQuery(
        credentials,
        `
SELECT ?node
WHERE {
  VALUES ?node { ${url == null ? '' : '<' + url.toString() + '>'} <http://www.wikidata.org/entity/${encodeURIComponent(searchTerm)}>  }
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
      );

      const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
        string,
        ExternalGraphDatabaseNode
      >();

      for (const line of await bindingsStream.toArray({
        limit: ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements,
      })) {
        const node: Term | null = line.get('node') ?? null;
        if (node == null) {
          continue;
        }
        super._collectNode(node, null, nodes, credentials);
      }

      const result: ExternalGraphDatabaseNode[] = nodes.toValueArray();

      await this._applyNodeTitlesToElementArray(result, credentials);

      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._findNodeByNativeId(credentials, nativeNodeId);
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._expandClusterNode(credentials, nodeIds, neighbors);
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._findRelationshipsByIds(credentials, relationshipIds);
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
  }

  public override async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    try {
      const result: ExternalGraphDatabaseQueryResult =
        await super._findShortestPath(credentials, nodeIds);
      await this._applyTitleToQueryResult(result, credentials);
      return result;
    } catch (error) {
      return this._logAndRethrow(error);
    }
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

    const bindingsStream: BindingsStream = await super._runGenericSparqlQuery(
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
    ?intermediateEntity <http://wikiba.se/ontology#referenceValue> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Reference Value)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#qualifier> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Qualifier)") AS ?inputLabel)
  }
  UNION {
    ?intermediateEntity <http://wikiba.se/ontology#qualifierValue> ?input .
    ?intermediateEntity <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    BIND(CONCAT(?label, " (Qualifier Value)") AS ?inputLabel)
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
          nodes.reduce<string[]>(
            (
              akku: string[],
              n: ExternalGraphDatabaseNode | ExternalGraphDatabaseRelationship,
            ): string[] => {
              if (typeof n.properties['sparql'] === 'string') {
                akku.push(n.properties['sparql']);
                return akku;
              } else {
                return akku;
              }
            },
            [],
          ),
        ),
        credentials,
      );
    for (const entry of nodes) {
      const key: string | null =
        typeof entry.properties['sparql'] === 'string'
          ? entry.properties['sparql']
          : null;
      if (key == null) {
        continue;
      }
      const title: string | null = resolvedNodeTitles.get(key) ?? null;
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
