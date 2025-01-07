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
    nodeDisplayConfigurations: Schema.Attribute.Component<
      'graph.node-display-configuration',
      true
    >;
  };
}

export interface GraphNodeDisplayConfiguration extends Struct.ComponentSchema {
  collectionName: 'components_graph_node_display_configurations';
  info: {
    description: '';
    displayName: 'Node Display Configuration';
    icon: 'information';
  };
  attributes: {
    backgroundColor: Schema.Attribute.String;
    displayText: Schema.Attribute.String;
    radius: Schema.Attribute.String;
    targetLabel: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'graph.graph-display-configuration': GraphGraphDisplayConfiguration;
      'graph.node-display-configuration': GraphNodeDisplayConfiguration;
    }
  }
}
