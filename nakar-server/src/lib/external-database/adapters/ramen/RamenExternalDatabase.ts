import { SMap } from '../../../../packages/map/Map';
import { SSet } from '../../../../packages/set/Set';
import type { DatabaseService } from '../../../database/DatabaseService';
import type { LiveCanvasArgument } from '../../../live-canvas/graph/LiveCanvasArgument';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';
import { Neo4jExternalDatabase } from '../neo4j/Neo4jExternalDatabase';
import { v4 } from 'uuid';

interface AnnotationCandidate {
  title: string;
  properties: ExternalGraphDatabaseNode['properties'];
  incoming: ExternalGraphDatabaseRelationship[];
  outgoing: ExternalGraphDatabaseRelationship[];
}

export class RamenExternalDatabase extends Neo4jExternalDatabase {
  public constructor(private readonly _database: DatabaseService) {
    super();
  }

  public override async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: LiveCanvasArgument[],
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const result: ExternalGraphDatabaseQueryResult = await super.executeQuery(
      credentials,
      query,
      queryArguments,
      limitConfig,
    );
    if (!limitConfig.shouldCollectGraphElements()) {
      return result;
    }

    const titleProperties: SMap<string, string> = new SMap<string, string>();
    for (const rule of await this._database.getRamenEdgeTitleRules(
      credentials.nakarId,
    )) {
      if (rule.annotationType != null) {
        const titleProperty: string | null | undefined = rule.titleProperty;
        titleProperties.set(
          rule.annotationType,
          titleProperty == null || titleProperty.trim().length === 0
            ? 'type'
            : titleProperty,
        );
      }
    }
    if (titleProperties.size > 0) {
      this._collapseAnnotations(result, credentials, titleProperties);
    }
    return result;
  }

  private _collapseAnnotations(
    result: ExternalGraphDatabaseQueryResult,
    credentials: ExternalGraphDatabaseCredentials,
    titleProperties: SMap<string, string>,
  ): void {
    const candidates: SMap<string, AnnotationCandidate> = new SMap<
      string,
      AnnotationCandidate
    >();
    for (const node of result.nodes.values()) {
      if (
        node.source.nakarId !== credentials.nakarId ||
        !node.labels.includes('Annotation')
      ) {
        continue;
      }
      const annotationType: unknown = node.properties['type'];
      const property: string | undefined =
        typeof annotationType === 'string'
          ? titleProperties.get(annotationType)
          : undefined;
      if (property === undefined) {
        continue;
      }
      const title: unknown = node.properties[property];
      if (typeof title === 'string' && title.trim().length > 0) {
        candidates.set(node.nativeId, {
          title,
          properties: node.properties,
          incoming: [],
          outgoing: [],
        });
      }
    }
    for (const relationship of result.relationships.values()) {
      if (relationship.type === 'HAS_ANNOTATION') {
        candidates.get(relationship.endNodeId)?.incoming.push(relationship);
      } else if (relationship.type === 'REFERS_TO') {
        candidates.get(relationship.startNodeId)?.outgoing.push(relationship);
      }
    }

    const endpoints: SSet<string> = new SSet<string>();
    const collapsed: SSet<string> = new SSet<string>();
    const edges: ExternalGraphDatabaseRelationship[] = [];
    for (const [annotationId, candidate] of candidates) {
      if (candidate.incoming.length !== 1 || candidate.outgoing.length !== 1) {
        continue;
      }
      const incoming: ExternalGraphDatabaseRelationship = candidate.incoming[0];
      const outgoing: ExternalGraphDatabaseRelationship = candidate.outgoing[0];
      const start: ExternalGraphDatabaseNode | undefined = result.nodes.get(
        incoming.startNodeId,
      );
      const end: ExternalGraphDatabaseNode | undefined = result.nodes.get(
        outgoing.endNodeId,
      );
      if (
        start?.source.nakarId !== credentials.nakarId ||
        end?.source.nakarId !== credentials.nakarId ||
        incoming.source.nakarId !== credentials.nakarId ||
        outgoing.source.nakarId !== credentials.nakarId
      ) {
        continue;
      }

      collapsed.add(annotationId);
      endpoints.add(start.nativeId);
      endpoints.add(end.nativeId);
      edges.push({
        nativeId: v4(),
        type: candidate.title,
        startNodeId: start.nativeId,
        endNodeId: end.nativeId,
        properties: { ...candidate.properties },
        keys: new SSet(),
        source: credentials,
      });
    }

    const removed: SSet<string> = collapsed.filter(
      (nodeId: string): boolean => !endpoints.has(nodeId),
    );
    for (const nodeId of removed) {
      result.nodes.delete(nodeId);
    }

    // Keep links between visible nodes when one is a non-qualifying annotation.
    const isNonQualifyingAnnotation = (nodeId: string): boolean =>
      !collapsed.has(nodeId) &&
      result.nodes.get(nodeId)?.labels.includes('Annotation') === true;

    for (const [id, relationship] of result.relationships) {
      const { startNodeId, endNodeId }: ExternalGraphDatabaseRelationship =
        relationship;
      if (
        removed.has(startNodeId) ||
        removed.has(endNodeId) ||
        ((collapsed.has(startNodeId) || collapsed.has(endNodeId)) &&
          !isNonQualifyingAnnotation(startNodeId) &&
          !isNonQualifyingAnnotation(endNodeId))
      ) {
        result.relationships.delete(id);
      }
    }
    for (const edge of edges) {
      result.relationships.set(edge.nativeId, edge);
    }
  }
}
