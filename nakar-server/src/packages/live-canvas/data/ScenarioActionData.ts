import type { LayoutData } from './LayoutData';

/**
 * Describes one serialized scenario follow-up instruction, resolved by ScenarioActionFactory.
 */
export type ScenarioActionData =
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type:
        'connectResultNodes' | 'compressRelationships' | 'resetVisualization';
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'compressNodes';

      /**
       * Node label selected by this instruction.
       */
      label: string;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setGrowNodesBasedOnDegree' | 'setRelationshipClusterSize';

      /**
       * Validated sizing multiplier for the selected visualization policy.
       */
      factor: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setNodeColor';

      /**
       * Node label selected by this instruction.
       */
      label: string;

      /**
       * Palette index used to render this label or relationship type.
       */
      colorIndex: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setNodeRadius';

      /**
       * Node label selected by this instruction.
       */
      label: string;

      /**
       * Configured node radius or circle layout radius.
       */
      radius: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setNodeTitleProperty';

      /**
       * Node label selected by this instruction.
       */
      label: string;

      /**
       * Property name selected by this instruction.
       */
      property: string;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setRelationshipColor';

      /**
       * Relationship type selected by this operation.
       */
      edgeType: string;

      /**
       * Palette index used to render this label or relationship type.
       */
      colorIndex: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'setRelationshipWidth';

      /**
       * Relationship type selected by this operation.
       */
      edgeType: string;

      /**
       * Configured relationship width.
       */
      width: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'layout';

      /**
       * Layout-specific instruction and arguments.
       */
      layout: LayoutData;
    };
