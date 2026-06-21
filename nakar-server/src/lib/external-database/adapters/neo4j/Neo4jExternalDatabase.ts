import type {
  Driver,
  Record as Neo4jRecord,
  RecordShape,
  ResultSummary,
  Session,
} from 'neo4j-driver';
import neo4j, { auth, driver as createDriver } from 'neo4j-driver';
import type { SessionConfig } from 'neo4j-driver-core/types/driver';
import { SSet } from '../../../../packages/set/Set';
import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import { Neo4jGraphElementsFactory } from './Neo4jGraphElementsFactory';
import { Neo4jSearchCapabilities } from './Neo4jSearchCapabilities';
import { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';
import { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { ExternalGraphDatabaseStatsRelationship } from '../../data/ExternalGraphDatabaseStatsRelationship';
import { ExternalGraphDatabaseStatsLabel } from '../../data/ExternalGraphDatabaseStatsLabel';

export class Neo4jExternalDatabase implements ExternalGraphDatabase {
  private readonly _logger: Logger = createChildLogger(this);

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const driver: Driver = createDriver(
      credentials.connectionUrl ?? '',
      auth.basic(credentials.username ?? '', credentials.password ?? ''),
    );
    this._logger.debug(
      `Did create driver: ${JSON.stringify(await driver.getServerInfo())}`,
    );
    try {
      const sessionConfig: SessionConfig = {
        defaultAccessMode: neo4j.session.READ,
        database: credentials.database,
      };
      const session: Session = driver.session(sessionConfig);
      this._logger.debug(`Did open session: ${JSON.stringify(sessionConfig)}`);
      try {
        this._logger.debug(
          `Will run query: ${query} with data: ${JSON.stringify(parameters).length.toString()} bytes`,
        );

        const factory: Neo4jGraphElementsFactory =
          new Neo4jGraphElementsFactory(limitConfig);
        await new Promise<void>(
          (resolve: () => void, reject: (error: Error) => void): void => {
            session
              .run<RecordShape<string, unknown>>(query, parameters, {
                timeout: 2 * 60000,
              })
              .subscribe({
                onNext: (
                  record: Neo4jRecord<RecordShape<string, unknown>>,
                ): void => {
                  if (factory.limitReached) {
                    /* discard result. */
                  } else {
                    factory.collectRecord(record, credentials);
                  }
                },
                onCompleted: (result: ResultSummary): void => {
                  this._logger.debug(JSON.stringify(result));
                  resolve();
                },
                onError: (error: Error): void => {
                  reject(error);
                },
              });
          },
        );

        const result: ExternalGraphDatabaseQueryResult = factory.getResult();
        this._logger.debug(
          `Did receive ${result.size.toString()} graph elements.`,
        );

        await session.close();
        await driver.close();

        return result;
      } catch (error) {
        await session.close();
        this._logger.error(error);
        throw error;
      }
    } catch (error) {
      await driver.close();
      this._logger.error(error);
      throw error;
    }
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const nodesIds: string[] = [...nodeIds.values()];
    this._logger.info(
      `Will load connecting relationships of ${nodesIds.length.toString()} nodes`,
    );
    return await this.executeQuery(
      credentials,
      `MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN DISTINCT additionalRelationship;`,
      {
        existingNodeIds: nodesIds,
      },
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
    const nodesIds: string[] = [...nodeIds.values()];
    if (limit) {
      return await this.executeQuery(
        credentials,
        `MATCH (a)-[additionalRelationship]-(b)
        WHERE elementId(a) IN $nodesIds
        AND (type(additionalRelationship) in $relationships OR ANY(label IN labels(b) WHERE label IN $labels))
        RETURN additionalRelationship, b
        LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalElements.toString()};`,
        {
          nodesIds: nodesIds,
          relationships: limit.relationships,
          labels: limit.labels,
        },
        new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
      );
    } else {
      return await this.executeQuery(
        credentials,
        `MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $nodesIds RETURN additionalRelationship, b LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()};`,
        {
          nodesIds: nodesIds,
        },
        new ExternalGraphDatabaseQueryLimitConfig('preview', 'graphElements'),
      );
    }
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const nodesIds: string[] = [...nodeIds.values()];
    const relationships: ExternalGraphDatabaseQueryResult =
      await this.executeQuery(
        credentials,
        `MATCH (a)-[neighbor]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
RETURN type(neighbor) AS rtype, count(*) AS rcount
ORDER BY rcount DESC, rtype ASC`,
        {
          nodesIds: nodesIds,
        },
        new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
      );
    const expandNodePreviewRelationshipEntries: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      relationships.tableData.map(
        (
          entry: SMap<string, unknown>,
        ): ExternalGraphDatabaseExpandNodePreviewEntry =>
          new ExternalGraphDatabaseExpandNodePreviewEntry(
            String(entry.get('rtype')),
            Number(entry.get('rcount')),
          ),
      );

    const labels: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      `MATCH (a)-[]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
UNWIND labels(b) as label
RETURN label, count(*) AS lcount
ORDER BY lcount DESC, label ASC`,
      {
        nodesIds: nodesIds,
      },
      new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
    );
    const expandNodePreviewLabelEntries: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      labels.tableData.map(
        (
          entry: SMap<string, unknown>,
        ): ExternalGraphDatabaseExpandNodePreviewEntry =>
          new ExternalGraphDatabaseExpandNodePreviewEntry(
            String(entry.get('label')),
            Number(entry.get('lcount')),
          ),
      );

    return new ExternalGraphDatabaseExpandNodePreview(
      expandNodePreviewLabelEntries,
      expandNodePreviewRelationshipEntries,
    );
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    return await this._fetchDbStats(credentials);
  }

  public async getSearchCapabilities(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseSearchCapabilities> {
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      'SHOW INDEXES',
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
    );

    let canExactMatchLabel: boolean = false;
    const exactMatchNodeProperties: SMap<string, SSet<string>> = new SMap<
      string,
      SSet<string>
    >();
    const fuzzyMatchNodeProperties: SMap<string, SSet<string>> = new SMap<
      string,
      SSet<string>
    >();

    for (const line of result.tableData) {
      if (line.get('state') !== 'ONLINE') {
        continue;
      }
      if (line.get('type') === 'LOOKUP' && line.get('entityType') === 'NODE') {
        canExactMatchLabel = true;
      } else if (
        line.get('type') === 'RANGE' &&
        line.get('entityType') === 'NODE'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const labelsOrTypes: string[] = line.get('labelsOrTypes') as string[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const properties: string[] = line.get('properties') as string[];
        for (const labelOrType of labelsOrTypes) {
          exactMatchNodeProperties.set(
            labelOrType,
            (
              exactMatchNodeProperties.get(labelOrType) ?? new SSet<string>()
            ).byMerging(new SSet<string>(properties)),
          );
        }
      } else if (
        line.get('type') === 'TEXT' &&
        line.get('entityType') === 'NODE'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const labelsOrTypes: string[] = line.get('labelsOrTypes') as string[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const properties: string[] = line.get('properties') as string[];
        for (const labelOrType of labelsOrTypes) {
          fuzzyMatchNodeProperties.set(
            labelOrType,
            (
              fuzzyMatchNodeProperties.get(labelOrType) ?? new SSet<string>()
            ).byMerging(new SSet<string>(properties)),
          );
        }
      }
    }

    return new Neo4jSearchCapabilities({
      canExactMatchLabel: canExactMatchLabel,
      exactMatchNodeProperties: exactMatchNodeProperties,
      fuzzyMatchNodeProperties: fuzzyMatchNodeProperties,
    });
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    const searchCapabilities: ExternalGraphDatabaseSearchCapabilities =
      await this.getSearchCapabilities(credentials);

    const queries: string[] = [];
    const data: Record<string, unknown> = {
      searchTerm: searchTerm,
    };
    const limit: ExternalGraphDatabaseQueryLimitConfig =
      new ExternalGraphDatabaseQueryLimitConfig('preview', 'graphElements');

    queries.push(
      `MATCH (n) WHERE elementId(n) = $searchTerm\nRETURN n\nLIMIT ${limit.getLimit()}`,
    );
    if (searchCapabilities.canExactMatchLabel) {
      queries.push(
        `MATCH (n: $searchTerm)\nRETURN n\nLIMIT ${limit.getLimit()}`,
      );
    }
    for (const exactMatchLabelAndProperty of searchCapabilities.exactMatchNodeProperties) {
      const label: string = exactMatchLabelAndProperty[0];
      const propeties: SSet<string> = exactMatchLabelAndProperty[1];
      for (const property of propeties) {
        queries.push(
          `MATCH (n: \`${label}\`) WHERE n.\`${property}\` = $searchTerm\nRETURN n\nLIMIT ${limit.getLimit()}`,
        );
      }
    }
    for (const fuzzyMatchLabelAndProperty of searchCapabilities.fuzzyMatchNodeProperties) {
      const label: string = fuzzyMatchLabelAndProperty[0];
      const propeties: SSet<string> = fuzzyMatchLabelAndProperty[1];
      for (const property of propeties) {
        queries.push(
          `MATCH (n: \`${label}\`) WHERE n.\`${property}\` CONTAINS $searchTerm\nRETURN n\nLIMIT ${limit.getLimit()}`,
        );
      }
    }

    const query: string = queries.join('\nUNION ALL\n');

    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      query,
      data,
      limit,
    );

    return result.nodes.toValueArray();
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      'MATCH (n) WHERE elementId(n) = $id RETURN n LIMIT 1;',
      { id: nativeNodeId },
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: string[],
    neighbors: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      'MATCH (n) WHERE elementId(n) IN $nodeIds OPTIONAL MATCH (n)-[r]-(neighbor) WHERE elementId(neighbor) in $neighbors RETURN n, r',
      {
        nodeIds: nodeIds,
        neighbors: neighbors,
      },
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      'MATCH (a)-[r]-(b) WHERE elementId(r) IN $relationshipIds RETURN r',
      {
        relationshipIds: relationshipIds,
      },
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    elementIdA: string,
    elementIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      'MATCH p = allShortestPaths((a)-[*]-(b)) WHERE elementId(a) = $elementIdA AND elementId(b) = $elementIdB RETURN p',
      {
        elementIdA: elementIdA,
        elementIdB: elementIdB,
      },
      new ExternalGraphDatabaseQueryLimitConfig('default', 'graphElements'),
    );
  }

  private async _getLabels(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<SSet<string>> {
    const labelsResult: ExternalGraphDatabaseQueryResult =
      await this.executeQuery(
        credentials,
        'CALL db.labels() YIELD label RETURN label ORDER BY label ASC',
        {},
        new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
      );
    const labels: SSet<string> = new SSet<string>(
      labelsResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('label')),
      ),
    );
    return labels;
  }

  private async _getRelationshipTypes(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<SSet<string>> {
    const relTypesResult: ExternalGraphDatabaseQueryResult =
      await this.executeQuery(
        credentials,
        'CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType ASC',
        {},
        new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
      );
    const relTypes: SSet<string> = new SSet<string>(
      relTypesResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('relationshipType')),
      ),
    );
    return relTypes;
  }

  private async _fetchDbStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    const labels: SSet<string> = await this._getLabels(credentials);
    const relTypes: SSet<string> =
      await this._getRelationshipTypes(credentials);
    const stats: ExternalGraphDatabaseStats = {
      labelCount: labels.size,
      labels: labels.flatMap(
        (label: string): ExternalGraphDatabaseStatsLabel => ({
          label: label,
          exploreQuery: this._exploreQueryOfLabel(label),
        }),
      ),
      relTypeCount: relTypes.size,
      rels: relTypes.flatMap(
        (relType: string): ExternalGraphDatabaseStatsRelationship => ({
          relType: relType,
          exploreQuery: this._exploreQueryOfRelationshipType(relType),
        }),
      ),
      nodeCount: await this._getNodesCount(credentials),
      relCount: await this._getRelationshipsCount(credentials),
    };
    return stats;
  }

  private _exploreQueryOfLabel(label: string): string {
    return `MATCH (n:\`${label}\`) RETURN * LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()};`;
  }

  private _exploreQueryOfRelationshipType(relType: string): string {
    return `MATCH (a)-[r:\`${relType}\`]-(b) RETURN * LIMIT ${ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements.toString()};`;
  }

  private async _getNodesCount(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<number> {
    this._logger.debug(`Will query nodes count.`);
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      'MATCH (n) RETURN count(n) AS nodeCount',
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get node count from query.');
    }
    return Number(result.tableData[0].get('nodeCount'));
  }

  private async _getRelationshipsCount(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<number> {
    this._logger.debug(`Will query rels count.`);
    const result: ExternalGraphDatabaseQueryResult = await this.executeQuery(
      credentials,
      'MATCH ()-[r]->() RETURN count(r) AS relationshipCount',
      {},
      new ExternalGraphDatabaseQueryLimitConfig('default', 'tableData'),
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get relationship count from query.');
    }
    return Number(result.tableData[0].get('relationshipCount'));
  }
}
