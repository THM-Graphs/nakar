import { InvalidDataError } from '../error/InvalidDataError';
import type { ScenarioActionData } from '../data/ScenarioActionData';
import { CompressNodesAction } from './CompressNodesAction';
import { CompressRelationshipsAction } from './CompressRelationshipsAction';
import { CircleLayoutAction } from './CircleLayoutAction';
import { ForceDirectedLayoutAction } from './ForceDirectedLayoutAction';
import { HierarchyLayoutAction } from './HierarchyLayoutAction';
import { ConfigureViewAction } from './ConfigureViewAction';
import { SetViewSettingsAction } from './SetViewSettingsAction';
import { ConnectResultNodesAction } from './ConnectResultNodesAction';
import type { CanvasAction } from './CanvasAction';

/**
 * Creates concrete polymorphic canvas actions from serialized scenario instructions.
 */
export class ScenarioActionFactory {
  /**
   * Creates the concrete canvas action corresponding to a serialized scenario instruction.
   * @param data - Data object or snapshot used to initialize the operation.
   * @returns The concrete action implementing the serialized instruction.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public create(data: ScenarioActionData): CanvasAction {
    switch (data.type) {
      case 'connectResultNodes':
        return new ConnectResultNodesAction();
      case 'compressNodes':
        return new CompressNodesAction(data.label);
      case 'compressRelationships':
        return new CompressRelationshipsAction();
      case 'resetVisualization':
        return new SetViewSettingsAction();
      case 'layout': {
        const layout: typeof data.layout = data.layout;
        switch (layout.type) {
          case 'circle':
            return new CircleLayoutAction(
              layout.nodeIds ?? layout.label ?? [],
              layout.radius,
            );
          case 'hierarchy':
            return new HierarchyLayoutAction(layout.edgeType);
          case 'forceDirected':
            return new ForceDirectedLayoutAction(
              layout.nodeIds ?? layout.label ?? [],
            );
        }
        throw new InvalidDataError('Unknown layout type.');
      }
      case 'setGrowNodesBasedOnDegree':
      case 'setRelationshipClusterSize':
      case 'setNodeColor':
      case 'setNodeRadius':
      case 'setNodeTitleProperty':
      case 'setRelationshipColor':
      case 'setRelationshipWidth':
        return new ConfigureViewAction(data);
      default:
        throw new InvalidDataError('Unknown scenario action.');
    }
  }
}
