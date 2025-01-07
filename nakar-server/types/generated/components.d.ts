import type { Schema, Struct } from '@strapi/strapi';

export interface GraphGraphDisplayConfiguration extends Struct.ComponentSchema {
  collectionName: 'components_graph_graph_display_configurations';
  info: {
    description: '';
    displayName: 'Graph Display Configuration';
    icon: 'brush';
  };
  attributes: {
    connectResultNodes: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    growNodesBasedOnDegree: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'graph.graph-display-configuration': GraphGraphDisplayConfiguration;
    }
  }
}
