import type { QueryData } from '../data/QueryData';

/**
 * Describes a normalized source operation, including source-native IDs and optional expansion limits.
 */
export type GraphRequest =
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'query';

      /**
       * Source query text; null means that no query text is configured.
       */
      query: QueryData;

      /**
       * Resolved parameter values indexed by scenario parameter identifier.
       */
      arguments: Record<string, unknown>;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'expand';

      /**
       * Source-native element identities requested from the source.
       */
      nativeIds: string[];

      /**
       * Source-native neighbor identities supplied as expansion context.
       */
      neighborIds: string[];

      /**
       * Whether the source expansion may return clustered results.
       */
      cluster: boolean;

      /**
       * Optional label and relationship constraints for source expansion.
       */
      limit: {
        /**
         * Node labels or per-label visualization settings, according to the containing data contract.
         */
        labels: string[];

        /**
         * Relationship types allowed by the expansion limit.
         */
        relationships: string[];
      } | null;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'relationships' | 'connect' | 'shortestPath' | 'node';

      /**
       * Source-native element identities requested from the source.
       */
      nativeIds: string[];
    };
