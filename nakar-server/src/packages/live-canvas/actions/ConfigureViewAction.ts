import type { ScenarioActionData } from '../data/ScenarioActionData';
import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Applies one scenario visualization instruction to the draft view settings.
 */
export class ConfigureViewAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Configure view';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'short';

  /** Visualization instructions preserve graph history and redo entries. */
  public override readonly history: boolean = false;

  /**
   * Retains one serialized visualization instruction for later application.
   * @param _data - Data object or snapshot used to initialize the operation.
   */
  public constructor(
    private readonly _data: Exclude<
      ScenarioActionData,
      {
        /**
         * Discriminator selecting the concrete event, operation or relationship type.
         */
        type:
          | 'layout'
          | 'compressNodes'
          | 'connectResultNodes'
          | 'compressRelationships'
          | 'resetVisualization';
      }
    >,
  ) {
    super();
  }

  /**
   * Applies one scenario visualization instruction to the draft view settings.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    const data: typeof this._data = this._data;
    switch (data.type) {
      case 'setGrowNodesBasedOnDegree':
        context.settings.setFactor('grow', data.factor);
        break;
      case 'setRelationshipClusterSize':
        context.settings.setFactor('relationships', data.factor);
        break;
      case 'setNodeColor':
        context.settings.label(data.label).colorIndex = data.colorIndex;
        break;
      case 'setNodeRadius':
        context.settings.label(data.label).radius = data.radius;
        context.settings.label(data.label).customRadius = true;
        break;
      case 'setNodeTitleProperty':
        context.settings.label(data.label).titleProperty = data.property;
        context.settings.label(data.label).customTitleProperty = true;
        break;
      case 'setRelationshipColor':
        context.settings.edge(data.edgeType).colorIndex = data.colorIndex;
        context.settings.edge(data.edgeType).customColor = true;
        break;
      case 'setRelationshipWidth':
        context.settings.edge(data.edgeType).width = data.width;
        context.settings.edge(data.edgeType).customWidth = true;
        break;
    }
  }
}
