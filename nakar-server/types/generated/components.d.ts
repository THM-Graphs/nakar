import type { Schema, Struct } from '@strapi/strapi';

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
    nodeDisplayConfigurations: Schema.Attribute.Component<
      'graph.node-display-configuration',
      true
    >;
    scaleType: Schema.Attribute.Enumeration<
      ['inherit', 'linear', 'log2', 'logn', 'log10']
    > &
      Schema.Attribute.DefaultTo<'inherit'>;
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

export interface RoomEdge extends Struct.ComponentSchema {
  collectionName: 'components_room_edges';
  info: {
    description: '';
    displayName: 'Edge';
  };
  attributes: {
    compressedCount: Schema.Attribute.Integer;
    edgeId: Schema.Attribute.String;
    endNodeId: Schema.Attribute.String;
    namesInQuery: Schema.Attribute.JSON;
    parallelCount: Schema.Attribute.Integer;
    parallelIndex: Schema.Attribute.Decimal;
    properties: Schema.Attribute.Component<'room.property', true>;
    startNodeId: Schema.Attribute.String;
    type: Schema.Attribute.String;
    width: Schema.Attribute.Decimal;
  };
}

export interface RoomGraph extends Struct.ComponentSchema {
  collectionName: 'components_room_graphs';
  info: {
    description: '';
    displayName: 'Graph';
  };
  attributes: {
    edges: Schema.Attribute.Component<'room.edge', true>;
    labels: Schema.Attribute.Component<'room.label', true>;
    nodes: Schema.Attribute.Component<'room.node', true>;
    tableDataEntries: Schema.Attribute.Component<'room.table-data', true>;
  };
}

export interface RoomLabel extends Struct.ComponentSchema {
  collectionName: 'components_room_labels';
  info: {
    description: '';
    displayName: 'label';
  };
  attributes: {
    count: Schema.Attribute.Integer;
    customBackgroundColor: Schema.Attribute.String;
    customTextColor: Schema.Attribute.String;
    label: Schema.Attribute.String;
    presetColorIndex: Schema.Attribute.Integer;
    type: Schema.Attribute.Enumeration<['PresetColor', 'CustomColor']>;
  };
}

export interface RoomNode extends Struct.ComponentSchema {
  collectionName: 'components_room_nodes';
  info: {
    description: '';
    displayName: 'node';
  };
  attributes: {
    customBackgroundColor: Schema.Attribute.String;
    customTitle: Schema.Attribute.String;
    customTitleColor: Schema.Attribute.String;
    inDegree: Schema.Attribute.Decimal;
    labels: Schema.Attribute.JSON;
    namesInQuery: Schema.Attribute.JSON;
    nodeId: Schema.Attribute.String;
    outDegree: Schema.Attribute.Decimal;
    positionX: Schema.Attribute.Decimal;
    positionY: Schema.Attribute.Decimal;
    properties: Schema.Attribute.Component<'room.property', true>;
    radius: Schema.Attribute.Decimal;
  };
}

export interface RoomProperty extends Struct.ComponentSchema {
  collectionName: 'components_room_properties';
  info: {
    displayName: 'property';
  };
  attributes: {
    key: Schema.Attribute.String;
    value: Schema.Attribute.JSON;
  };
}

export interface RoomTableData extends Struct.ComponentSchema {
  collectionName: 'components_room_table_data';
  info: {
    description: '';
    displayName: 'tableDataEntry';
  };
  attributes: {
    rowData: Schema.Attribute.JSON;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'graph.graph-display-configuration': GraphGraphDisplayConfiguration;
      'graph.node-display-configuration': GraphNodeDisplayConfiguration;
      'room.edge': RoomEdge;
      'room.graph': RoomGraph;
      'room.label': RoomLabel;
      'room.node': RoomNode;
      'room.property': RoomProperty;
      'room.table-data': RoomTableData;
    }
  }
}
