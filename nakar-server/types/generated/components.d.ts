import type { Schema, Struct } from '@strapi/strapi';

export interface GraphGraphDisplayConfiguration extends Struct.ComponentSchema {
  collectionName: 'components_graph_graph_display_configurations';
  info: {
    description: '';
    displayName: 'Graph Display Configuration';
    icon: 'brush';
  };
  attributes: {
    connectResultNodes: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    growNodesBasedOnDegree: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'graph.graph-display-configuration': GraphGraphDisplayConfiguration;
    }
  }
}
