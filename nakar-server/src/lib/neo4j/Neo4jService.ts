import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';
import neo4j, {
  auth,
  Driver,
  driver as createDriver,
  Record as Neo4jRecord,
  RecordShape,
  ResultSummary,
  Session,
} from 'neo4j-driver';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import { SSet } from '../../packages/set/Set';
import { Neo4jGraphElementsFactory } from './Neo4jGraphElementsFactory';
import { SessionConfig } from 'neo4j-driver-core/types/driver';
import { ExpandNodePreview } from './expand-node-preview/ExpandNodePreview';
import { ExpandNodePreviewEntry } from './expand-node-preview/ExpandNodePreviewEntry';
import { SMap } from '../../packages/map/Map';
import { Neo4jLimitConfig } from './Neo4jLimitConfig';
import { Neo4jSearchCapabilities } from './Neo4jSearchCapabilities';
import { Neo4jNode } from './Neo4jNode';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Injectable } from '@nestjs/common';
import { GetDatabaseStatsResponseBodyDto } from '../http/routes/canvas-database-connection/dto/GetDatabaseStatsResponseBodyDto';
import { DatabaseStatsRelationshipDto } from '../http/routes/canvas-database-connection/dto/DatabaseStatsRelationshipDto';
import { DatabaseStatsLabelDto } from '../http/routes/canvas-database-connection/dto/DatabaseStatsLabelDto';

@Injectable()
export class Neo4jService {
  private readonly _logger: Logger = createChildLogger(this);

  public async executeQuery(
    databaseInfo: Neo4jDatabaseInfo,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: Neo4jLimitConfig,
  ): Promise<Neo4jGraphElements> {
    const driver: Driver = createDriver(
      databaseInfo.url,
      auth.basic(databaseInfo.username, databaseInfo.password),
    );
    this._logger.debug(
      `Did create driver: ${JSON.stringify(await driver.getServerInfo())}`,
    );
    try {
      const sessionConfig: SessionConfig = {
        defaultAccessMode: neo4j.session.READ,
        database: databaseInfo.database ?? undefined,
      };
      const session: Session = driver.session(sessionConfig);
      this._logger.debug(`Did open session: ${JSON.stringify(sessionConfig)}`);
      try {
        this._logger.debug(
          `Will run query: ${query} with data: ${JSON.stringify(parameters).length.toString()} bytes`,
        );

        const neo4jGraphElementsFactory: Neo4jGraphElementsFactory =
          new Neo4jGraphElementsFactory(limitConfig);
        await new Promise<void>(
          (resolve: () => void, reject: (error: Error) => void): void => {
            session
              .run<
                RecordShape<string, unknown>
              >(query, parameters, { timeout: 2 * 60000 })
              .subscribe({
                onNext: (
                  record: Neo4jRecord<RecordShape<string, unknown>>,
                ): void => {
                  if (neo4jGraphElementsFactory.limitReached) {
                    /* discard result. */
                  } else {
                    neo4jGraphElementsFactory.collectRecord(
                      record,
                      databaseInfo,
                    );
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

        const result: Neo4jGraphElements =
          neo4jGraphElementsFactory.getResult();
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
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    this._logger.info(
      `Will load connecting relationships of ${nodesIds.length.toString()} nodes in ${databaseInfo.url}`,
    );
    const additional: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN DISTINCT additionalRelationship;`,
      {
        existingNodeIds: nodesIds,
      },
      new Neo4jLimitConfig('default', 'graphElements'),
    );
    return additional;
  }

  public async expandNode(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
    limit: { relationships: SSet<string>; labels: SSet<string> } | null,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    if (limit) {
      return await this.executeQuery(
        databaseInfo,
        `MATCH (a)-[additionalRelationship]-(b)
        WHERE elementId(a) IN $nodesIds
        AND (type(additionalRelationship) in $relationships OR ANY(label IN labels(b) WHERE label IN $labels))
        RETURN additionalRelationship, b
        LIMIT ${Neo4jLimitConfig.maximalElements.toString()};`,
        {
          nodesIds: nodesIds,
          relationships: limit.relationships,
          labels: limit.labels,
        },
        new Neo4jLimitConfig('default', 'graphElements'),
      );
    } else {
      return await this.executeQuery(
        databaseInfo,
        `MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $nodesIds RETURN additionalRelationship, b LIMIT ${Neo4jLimitConfig.maximalPreviewElements.toString()};`,
        {
          nodesIds: nodesIds,
        },
        new Neo4jLimitConfig('preview', 'graphElements'),
      );
    }
  }

  public async expandNodePreview(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
  ): Promise<ExpandNodePreview> {
    const nodesIds: string[] = [...nodeIds.values()];
    const relationships: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[neighbor]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
RETURN type(neighbor) AS rtype, count(*) AS rcount
ORDER BY rcount DESC, rtype ASC`,
      {
        nodesIds: nodesIds,
      },
      new Neo4jLimitConfig('default', 'tableData'),
    );
    const expandNodePreviewRelationshipEntries: ExpandNodePreviewEntry[] =
      relationships.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewEntry =>
          new ExpandNodePreviewEntry(
            String(entry.get('rtype')),
            Number(entry.get('rcount')),
          ),
      );

    const labels: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
UNWIND labels(b) as label
RETURN label, count(*) AS lcount
ORDER BY lcount DESC, label ASC`,
      {
        nodesIds: nodesIds,
      },
      new Neo4jLimitConfig('default', 'tableData'),
    );
    const expandNodePreviewLabelEntries: ExpandNodePreviewEntry[] =
      labels.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewEntry =>
          new ExpandNodePreviewEntry(
            String(entry.get('label')),
            Number(entry.get('lcount')),
          ),
      );

    return new ExpandNodePreview(
      expandNodePreviewLabelEntries,
      expandNodePreviewRelationshipEntries,
    );
  }

  public async getStats(params: {
    credentials: Neo4jDatabaseInfo;
  }): Promise<GetDatabaseStatsResponseBodyDto> {
    // TODO: Create own result type
    return await this._fetchDbStats(params.credentials);
  }

  public async getSearchCapabilities(params: {
    credentials: Neo4jDatabaseInfo;
  }): Promise<Neo4jSearchCapabilities> {
    const result: Neo4jGraphElements = await this.executeQuery(
      params.credentials,
      'SHOW INDEXES',
      {},
      new Neo4jLimitConfig('default', 'tableData'),
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

    const capabilities: Neo4jSearchCapabilities = new Neo4jSearchCapabilities({
      canExactMatchLabel: canExactMatchLabel,
      exactMatchNodeProperties: exactMatchNodeProperties,
      fuzzyMatchNodeProperties: fuzzyMatchNodeProperties,
    });

    return capabilities;
  }

  public async search(params: {
    credentials: Neo4jDatabaseInfo;
    searchTerm: string;
  }): Promise<Neo4jNode[]> {
    const searchCapabilities: Neo4jSearchCapabilities =
      await this.getSearchCapabilities({ credentials: params.credentials });

    const queries: string[] = [];
    const data: Record<string, unknown> = {
      searchTerm: params.searchTerm,
    };
    const limit: Neo4jLimitConfig = new Neo4jLimitConfig(
      'preview',
      'graphElements',
    );

    queries.push(
      `MATCH (n) WHERE elementId(n) = $searchTerm\nRETURN n\nLIMIT ${limit.getLimit()}`,
    );
    if (searchCapabilities.canExactMatchLabel) {
      queries.push(
        // TODO: Sanitize $searchTerm
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

    const result: Neo4jGraphElements = await this.executeQuery(
      params.credentials,
      query,
      data,
      limit,
    );

    return result.nodes.toValueArray();
  }

  private async _getLabels(
    credentials: Neo4jDatabaseInfo,
  ): Promise<SSet<string>> {
    const labelsResult: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'CALL db.labels() YIELD label RETURN label ORDER BY label ASC',
      {},
      new Neo4jLimitConfig('default', 'tableData'),
    );
    const labels: SSet<string> = new SSet<string>(
      labelsResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('label')),
      ),
    );
    return labels;
  }

  private async _getRelationshipTypes(
    credentials: Neo4jDatabaseInfo,
  ): Promise<SSet<string>> {
    const relTypesResult: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType ASC',
      {},
      new Neo4jLimitConfig('default', 'tableData'),
    );
    const relTypes: SSet<string> = new SSet<string>(
      relTypesResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('relationshipType')),
      ),
    );
    return relTypes;
  }

  private async _fetchDbStats(
    credentials: Neo4jDatabaseInfo,
  ): Promise<GetDatabaseStatsResponseBodyDto> {
    const labels: SSet<string> = await this._getLabels(credentials);
    const relTypes: SSet<string> =
      await this._getRelationshipTypes(credentials);
    const stats: GetDatabaseStatsResponseBodyDto =
      new GetDatabaseStatsResponseBodyDto({
        labelCount: labels.size,
        labels: labels.flatMap(
          (label: string): DatabaseStatsLabelDto => ({
            label: label,
            exploreQuery: this._exploreQueryOfLabel(label),
          }),
        ),
        relTypeCount: relTypes.size,
        rels: relTypes.flatMap(
          (relType: string): DatabaseStatsRelationshipDto => ({
            relType: relType,
            exploreQuery: this._exploreQueryOfRelationshipType(relType),
          }),
        ),
        nodeCount: await this._getNodesCount(credentials),
        relCount: await this._getRelationshipsCount(credentials),
      });
    return stats;
  }

  private _exploreQueryOfLabel(label: string): string {
    return `MATCH (n:\`${label}\`) RETURN * LIMIT ${Neo4jLimitConfig.maximalPreviewElements.toString()};`;
  }

  private _exploreQueryOfRelationshipType(relType: string): string {
    return `MATCH (a)-[r:\`${relType}\`]-(b) RETURN * LIMIT ${Neo4jLimitConfig.maximalPreviewElements.toString()};`;
  }

  private async _getNodesCount(
    credentials: Neo4jDatabaseInfo,
  ): Promise<number> {
    this._logger.debug(`Will query nodes count.`);
    const result: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'MATCH (n) RETURN count(n) AS nodeCount',
      {},
      new Neo4jLimitConfig('default', 'tableData'),
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get node count from query.');
    }
    return Number(result.tableData[0].get('nodeCount'));
  }

  private async _getRelationshipsCount(
    credentials: Neo4jDatabaseInfo,
  ): Promise<number> {
    this._logger.debug(`Will query rels count.`);
    const result: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'MATCH ()-[r]->() RETURN count(r) AS relationshipCount',
      {},
      new Neo4jLimitConfig('default', 'tableData'),
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get relationship count from query.');
    }
    return Number(result.tableData[0].get('relationshipCount'));
  }
}
