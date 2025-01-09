import { DBScenario } from '../strapi-db/types/DBScenario';
import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';
import {
  SchemaColor,
  SchemaGetInitialGraph,
  SchemaGraphLabel,
  SchemaNode,
} from '../../../src-gen/schema';
import { NodeDisplayConfigurationData } from './NodeDisplayConfigurationData';
import { Neo4jWrapper } from '../neo4j/Neo4jWrapper';
import { GraphDtoFactory } from '../graph-transformer/GraphDtoFactory';
import { ColorIndex, ColorIndexSchema } from './ColorIndex';

export class DisplayConfiguration {
  private current: GraphDisplayConfiguration;

  public constructor() {
    this.current = new GraphDisplayConfiguration({
      connectResultNodes: null,
      growNodesBasedOnDegree: null,
      nodeDisplayConfigurations: [],
    });
  }

  public loadAllAndMerge(scenario: DBScenario): void {
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(
        scenario.scenarioGroup?.database?.graphDisplayConfiguration,
      ),
    );
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(
        scenario.scenarioGroup?.graphDisplayConfiguration,
      ),
    );
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(scenario.graphDisplayConfiguration),
    );
  }

  public mergeWith(otherConfig: GraphDisplayConfiguration): void {
    this.current = this.current.byMergingIntoSelf(otherConfig);
  }

  public async applyToGraph(
    graph: SchemaGetInitialGraph,
    neo4jWrapper: Neo4jWrapper,
  ): Promise<void> {
    await this.applyConnectNodes(graph, neo4jWrapper);
    this.applyLabels(graph);
    this.applyNodeDegrees(graph);
    this.applyEdgeParallelCounts(graph);

    for (const node of graph.graph.nodes) {
      this.applyNodeConfigurationData(node);
      this.applyAutoNodeDisplayTitle(node);
      this.applyNodeDisplayText(node);
      this.applyNodeRadius(node);
      this.applyNodeBackgroundColor(node);
    }

    this.applyGrowNodeBasedOnDegree(graph);
  }

  private async applyConnectNodes(
    graph: SchemaGetInitialGraph,
    neo4jWrapper: Neo4jWrapper,
  ): Promise<void> {
    if (this.current.connectResultNodes !== true) {
      return;
    }

    const nodeIds = new Set<string>(graph.graph.nodes.map((n) => n.id));
    const result = await neo4jWrapper.loadConnectingRelationships(nodeIds);

    const edges = GraphDtoFactory.transformEdges(result);
    for (const edge of edges) {
      if (graph.graph.edges.find((e) => e.id === edge.id)) {
        continue;
      }
      graph.graph.edges.push(edge);
    }
  }

  private applyGrowNodeBasedOnDegree(graph: SchemaGetInitialGraph): void {
    if (this.current.growNodesBasedOnDegree !== true) {
      return;
    }

    const degrees = graph.graph.nodes.map((n) => n.degree);

    const growFactor = 1;
    const minConnections = Math.min(...degrees);
    const maxConnections = Math.max(...degrees);
    const delta = maxConnections - minConnections;

    if (delta === 0) {
      return;
    }

    for (const node of graph.graph.nodes) {
      const percent = (node.degree - minConnections) / delta;
      node.radius = node.radius * (1 + growFactor * percent);
    }
  }

  private applyNodeDisplayText(node: SchemaNode): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        return;
      }
      if (nodeConfig.displayText === null) {
        return;
      }
      if (node.labels.find((l) => l.label === nodeConfig.targetLabel) == null) {
        return;
      }
      const data = NodeDisplayConfigurationData.fromNode(node);
      const newValue = data.applyToTemplate(nodeConfig.displayText);
      if (newValue.trim().length === 0) {
        return;
      }
      node.displayTitle = newValue;
    }
  }

  private applyNodeRadius(node: SchemaNode): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        return;
      }
      if (nodeConfig.radius === null) {
        return;
      }
      if (node.labels[0].label !== nodeConfig.targetLabel) {
        return;
      }
      const data = NodeDisplayConfigurationData.fromNode(node);
      const newValue = data.applyToTemplate(nodeConfig.radius);
      if (newValue.trim().length === 0) {
        return;
      }
      const newRadius = parseFloat(newValue);
      if (isNaN(newRadius)) {
        console.warn(
          `Unable to parse node radius config: ${nodeConfig.radius} for label ${nodeConfig.targetLabel}`,
        );
        return;
      }
      node.radius = newRadius;
    }
  }

  private applyNodeBackgroundColor(node: SchemaNode): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        return;
      }
      if (nodeConfig.backgroundColor === null) {
        return;
      }
      if (node.labels.length === 0) {
        continue;
      }
      if (node.labels[0].label !== nodeConfig.targetLabel) {
        return;
      }
      const data = NodeDisplayConfigurationData.fromNode(node);
      const newValue = data.applyToTemplate(nodeConfig.backgroundColor);
      if (newValue.trim().length === 0) {
        continue;
      }
      node.labels[0].color = {
        type: 'CustomColor',
        backgroundColor: newValue,
        textColor: '#000000',
      };
    }
  }

  private applyNodeDegrees(graph: SchemaGetInitialGraph): void {
    for (const node of graph.graph.nodes) {
      const outRels = graph.graph.edges.filter(
        (e) => e.startNodeId === node.id,
      );
      const inRels = graph.graph.edges.filter((e) => e.endNodeId === node.id);
      node.inDegree = inRels.length;
      node.outDegree = outRels.length;
      node.degree = node.inDegree + node.outDegree;
    }
  }

  private applyEdgeParallelCounts(graph: SchemaGetInitialGraph): void {
    for (const edge of graph.graph.edges) {
      if (edge.parallelCount > 0) {
        continue;
      }
      const others = graph.graph.edges.filter((e) => {
        if (
          e.startNodeId === edge.startNodeId &&
          e.endNodeId === edge.endNodeId
        ) {
          return true;
        } else if (
          e.startNodeId === edge.endNodeId &&
          e.endNodeId === edge.startNodeId
        ) {
          return true;
        } else {
          return false;
        }
      });

      others.forEach((other, index) => {
        other.parallelCount = others.length;

        if (other.isLoop) {
          other.parallelIndex = index;
        } else {
          if (other.parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              other.parallelIndex = index + 1;
            } else {
              other.parallelIndex = -index;
            }
          } else {
            if (index === 0) {
              other.parallelIndex = 0;
            }
            if (index % 2 === 0) {
              other.parallelIndex = index;
            } else {
              other.parallelIndex = -(index + 1);
            }
          }

          if (other.startNodeId.localeCompare(other.endNodeId) > 0) {
            other.parallelIndex = -other.parallelIndex;
          }
        }
      });
    }
  }

  private applyLabels(graph: SchemaGetInitialGraph): void {
    let colorIndex: ColorIndex = 0;

    for (const node of graph.graph.nodes) {
      for (const label of node.labels) {
        const foundEntry = graph.graphMetaData.labels.find(
          (l) => l.label === label.label,
        );

        if (!foundEntry) {
          const color: SchemaColor = { type: 'PresetColor', index: colorIndex };
          const newEntry: SchemaGraphLabel = {
            label: label.label,
            color: color,
            count: 1,
          };
          graph.graphMetaData.labels.push(newEntry);

          label.color = color;
          label.count = 1;

          colorIndex = ColorIndexSchema.default(0).parse((colorIndex + 1) % 6);
        } else {
          foundEntry.count += 1;
          label.count += 1;
          label.color = foundEntry.color;
        }
      }
    }
  }

  private applyAutoNodeDisplayTitle(node: SchemaNode): void {
    const nameProperty = node.properties.find((p) => p.slug === 'name');
    if (nameProperty != null) {
      node.displayTitle =
        typeof nameProperty.value === 'string'
          ? nameProperty.value
          : JSON.stringify(nameProperty.value);
      return;
    }

    const labelProperty = node.properties.find((p) => p.slug === 'label');
    if (labelProperty != null) {
      node.displayTitle =
        typeof labelProperty.value === 'string'
          ? labelProperty.value
          : JSON.stringify(labelProperty.value);
      return;
    }

    node.displayTitle = node.labels.map((l) => l.label).join(', ');
  }

  private applyNodeConfigurationData(node: SchemaNode): void {
    const data = NodeDisplayConfigurationData.fromNode(node);
    node.displayConfigurationData = data;
  }
}
