import type { Schema, Struct } from '@strapi/strapi';

export interface GraphAdditionalQuery extends Struct.ComponentSchema {
  collectionName: 'components_graph_additional_queries';
  info: {
    description: '';
    displayName: 'Additional Query';
    icon: 'code';
  };
  attributes: {
    mergeDatabase: Schema.Attribute.Relation<
      'oneToOne',
      'api::database.database'
    >;
    mergeLabel: Schema.Attribute.String;
    mergeProperties: Schema.Attribute.String;
    mergeQuery: Schema.Attribute.Text;
    originalLabel: Schema.Attribute.String;
    originalProperties: Schema.Attribute.String;
  };
}

export interface GraphColor extends Struct.ComponentSchema {
  collectionName: 'components_graph_colors';
  info: {
    description: '';
    displayName: 'Color';
    icon: 'brush';
  };
  attributes: {
    background: Schema.Attribute.String;
    index: Schema.Attribute.Integer;
    text: Schema.Attribute.String;
  };
}

export interface GraphGraphDisplayConfiguration extends Struct.ComponentSchema {
  collectionName: 'components_graph_graph_display_configurations';
  info: {
    description: '';
    displayName: 'Graph Display Configuration';
    icon: 'brush';
  };
  attributes: {
    compressRelationships: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    compressRelationshipsWidthFactor: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    connectResultNodes: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    growNodesBasedOnDegree: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    growNodesBasedOnDegreeFactor: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    mergeNodeConfigurations: Schema.Attribute.Component<
      'graph.merge-node-configuration',
      true
    >;
    nodeDisplayConfigurations: Schema.Attribute.Component<
      'graph.node-display-configuration',
      true
    >;
    scaleType: Schema.Attribute.Enumeration<
      ['inherit', 'linear', 'log2', 'logn', 'log10']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    treatNameInQueryAsLabel: Schema.Attribute.Enumeration<
      ['inherit', 'true', 'false']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
  };
}

export interface GraphMergeNodeConfiguration extends Struct.ComponentSchema {
  collectionName: 'components_graph_merge_node_configurations';
  info: {
    displayName: 'Merge Node Configuration';
    icon: 'code';
  };
  attributes: {
    mergeDatabase: Schema.Attribute.Relation<
      'oneToOne',
      'api::database.database'
    >;
    mergeLabel: Schema.Attribute.String;
    mergeProperties: Schema.Attribute.String;
    originalDatabase: Schema.Attribute.Relation<
      'oneToOne',
      'api::database.database'
    >;
    originalLabel: Schema.Attribute.String;
    originalProperties: Schema.Attribute.String;
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
    circleLayoutDistance: Schema.Attribute.Decimal;
    compress: Schema.Attribute.Enumeration<['true', 'false', 'inherit']> &
      Schema.Attribute.DefaultTo<'inherit'>;
    displayText: Schema.Attribute.String;
    layoutAlgorithm: Schema.Attribute.Enumeration<
      ['inherit', 'forceDirected', 'circle']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
    radius: Schema.Attribute.String;
    targetLabel: Schema.Attribute.String;
  };
}

export interface GraphParameter extends Struct.ComponentSchema {
  collectionName: 'components_graph_parameters';
  info: {
    displayName: 'Parameter';
    icon: 'code';
  };
  attributes: {
    defaultValue: Schema.Attribute.String;
    identifier: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface GraphQuery extends Struct.ComponentSchema {
  collectionName: 'components_graph_queries';
  info: {
    description: '';
    displayName: 'Query';
    icon: 'code';
  };
  attributes: {
    database: Schema.Attribute.Relation<'oneToOne', 'api::database.database'>;
    isTableQuery: Schema.Attribute.Boolean;
    query: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'graph.additional-query': GraphAdditionalQuery;
      'graph.color': GraphColor;
      'graph.graph-display-configuration': GraphGraphDisplayConfiguration;
      'graph.merge-node-configuration': GraphMergeNodeConfiguration;
      'graph.node-display-configuration': GraphNodeDisplayConfiguration;
      'graph.parameter': GraphParameter;
      'graph.query': GraphQuery;
    }
  }
}
