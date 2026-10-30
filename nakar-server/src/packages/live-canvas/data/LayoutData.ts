/**
 * Describes a portable explicit layout instruction and its layout-specific arguments.
 */
export type LayoutData =
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'circle';

      /**
       * Canonical node identities selected by this operation.
       */
      nodeIds?: string[];

      /** Label resolved against the loaded scenario graph when no explicit IDs are supplied. */
      label?: string;

      /**
       * Configured node radius or circle layout radius.
       */
      radius: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'hierarchy';

      /**
       * Relationship type selected by this operation.
       */
      edgeType: string;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'forceDirected';

      /**
       * Canonical node identities selected by this operation.
       */
      nodeIds?: string[];

      /** Label resolved against the loaded scenario graph when no explicit IDs are supplied. */
      label?: string;
    };
