import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiCanvasLabelSettingCanvasLabelSetting
  extends Struct.CollectionTypeSchema {
  collectionName: 'canvas_label_settings';
  info: {
    displayName: 'Canvas Node Setting';
    pluralName: 'canvas-label-settings';
    singularName: 'canvas-label-setting';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canvas: Schema.Attribute.Relation<'manyToOne', 'api::canvas.canvas'>;
    colorIndex: Schema.Attribute.Enumeration<
      ['color0', 'color1', 'color2', 'color3', 'color4', 'color5']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customColorIndex: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    customRadius: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::canvas-label-setting.canvas-label-setting'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    radius: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCanvasCanvas extends Struct.CollectionTypeSchema {
  collectionName: 'canvases';
  info: {
    description: '';
    displayName: 'Canvas';
    pluralName: 'canvases';
    singularName: 'canvas';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    compressRelationshipsWidthFactor: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    graph: Schema.Attribute.Media<'files'>;
    growNodesBasedOnDegree: Schema.Attribute.Boolean;
    growNodesBasedOnDegreeFactor: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::canvas.canvas'
    > &
      Schema.Attribute.Private;
    nodeSettings: Schema.Attribute.Relation<
      'oneToMany',
      'api::canvas-label-setting.canvas-label-setting'
    >;
    publishedAt: Schema.Attribute.DateTime;
    room: Schema.Attribute.Relation<'manyToOne', 'api::room.room'>;
    scaleType: Schema.Attribute.Enumeration<
      ['linear', 'log2', 'logn', 'log10']
    >;
    title: Schema.Attribute.String;
    treatNameInQueryAsLabel: Schema.Attribute.Boolean;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommonPropertyCommonProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'common_properties';
  info: {
    displayName: 'Common Property';
    pluralName: 'common-properties';
    singularName: 'common-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    leftDatabase: Schema.Attribute.Relation<
      'manyToOne',
      'api::database-connection.database-connection'
    >;
    leftLabel: Schema.Attribute.String;
    leftProperty: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::common-property.common-property'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    rightDatabase: Schema.Attribute.Relation<
      'manyToOne',
      'api::database-connection.database-connection'
    >;
    rightLabel: Schema.Attribute.String;
    rightProperty: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDatabaseConnectionDatabaseConnection
  extends Struct.CollectionTypeSchema {
  collectionName: 'database_connections';
  info: {
    description: '';
    displayName: 'Database Connection';
    pluralName: 'database-connections';
    singularName: 'database-connection';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    browserUrl: Schema.Attribute.String;
    commonPropertiesLeft: Schema.Attribute.Relation<
      'oneToMany',
      'api::common-property.common-property'
    >;
    commonPropertiesRight: Schema.Attribute.Relation<
      'oneToMany',
      'api::common-property.common-property'
    >;
    connectionUrl: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.String;
    linkProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::link-property.link-property'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::database-connection.database-connection'
    > &
      Schema.Attribute.Private;
    nodeTitleProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::node-title-property.node-title-property'
    >;
    password: Schema.Attribute.String;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    queries: Schema.Attribute.Relation<'oneToMany', 'api::query.query'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiLinkPropertyLinkProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'link_properties';
  info: {
    displayName: 'Link Property';
    pluralName: 'link-properties';
    singularName: 'link-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::database-connection.database-connection'
    >;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::link-property.link-property'
    > &
      Schema.Attribute.Private;
    property: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
  };
}

export interface ApiNodeReferenceNodeReference
  extends Struct.CollectionTypeSchema {
  collectionName: 'node_references';
  info: {
    displayName: 'Node Reference';
    pluralName: 'node-references';
    singularName: 'node-reference';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::node-reference.node-reference'
    > &
      Schema.Attribute.Private;
    nodeId: Schema.Attribute.String;
    note: Schema.Attribute.Relation<'manyToOne', 'api::note.note'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNodeTitlePropertyNodeTitleProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'node_title_properties';
  info: {
    displayName: 'Node Title Property';
    pluralName: 'node-title-properties';
    singularName: 'node-title-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::database-connection.database-connection'
    >;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::node-title-property.node-title-property'
    > &
      Schema.Attribute.Private;
    property: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNoteNote extends Struct.CollectionTypeSchema {
  collectionName: 'notes';
  info: {
    description: '';
    displayName: 'Note';
    pluralName: 'notes';
    singularName: 'note';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    content: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::note.note'> &
      Schema.Attribute.Private;
    nodes: Schema.Attribute.Relation<
      'oneToMany',
      'api::node-reference.node-reference'
    >;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPostScenarioActionPostScenarioAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'post_scenario_actions';
  info: {
    displayName: 'Post Scenario Action';
    pluralName: 'post-scenario-actions';
    singularName: 'post-scenario-action';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    circleRadius: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    label: Schema.Attribute.String;
    layoutAlgorithm: Schema.Attribute.Enumeration<['forceDirected', 'circle']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::post-scenario-action.post-scenario-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scenario: Schema.Attribute.Relation<'manyToOne', 'api::scenario.scenario'>;
    type: Schema.Attribute.Enumeration<
      ['connectResultNodes', 'compressRelationships', 'compressNodes', 'layout']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProjectProject extends Struct.CollectionTypeSchema {
  collectionName: 'projects';
  info: {
    description: '';
    displayName: 'Project';
    pluralName: 'projects';
    singularName: 'project';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    collaborators: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    commonProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::common-property.common-property'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    databaseConnections: Schema.Attribute.Relation<
      'oneToMany',
      'api::database-connection.database-connection'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::project.project'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::note.note'>;
    owner: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rooms: Schema.Attribute.Relation<'oneToMany', 'api::room.room'>;
    scenarioGroups: Schema.Attribute.Relation<
      'oneToMany',
      'api::scenario-group.scenario-group'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQueryParameterQueryParameter
  extends Struct.CollectionTypeSchema {
  collectionName: 'query_parameters';
  info: {
    displayName: 'Query Parameter';
    pluralName: 'query-parameters';
    singularName: 'query-parameter';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataType: Schema.Attribute.Enumeration<
      ['string', 'number', 'json', 'startDateTime', 'endDateTime']
    > &
      Schema.Attribute.DefaultTo<'string'>;
    defaultValue: Schema.Attribute.String;
    identifier: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::query-parameter.query-parameter'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scenario: Schema.Attribute.Relation<'manyToOne', 'api::scenario.scenario'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQueryQuery extends Struct.CollectionTypeSchema {
  collectionName: 'queries';
  info: {
    displayName: 'Query';
    pluralName: 'queries';
    singularName: 'query';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::database-connection.database-connection'
    >;
    isTableQuery: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::query.query'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    query: Schema.Attribute.String;
    scenario: Schema.Attribute.Relation<'manyToOne', 'api::scenario.scenario'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRoomRoom extends Struct.CollectionTypeSchema {
  collectionName: 'rooms';
  info: {
    description: '';
    displayName: 'Room';
    pluralName: 'rooms';
    singularName: 'room';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canvases: Schema.Attribute.Relation<'oneToMany', 'api::canvas.canvas'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::room.room'> &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visibility: Schema.Attribute.Enumeration<
      ['private', 'unlisted', 'public']
    > &
      Schema.Attribute.DefaultTo<'private'>;
  };
}

export interface ApiScenarioGroupScenarioGroup
  extends Struct.CollectionTypeSchema {
  collectionName: 'scenario_groups';
  info: {
    description: '';
    displayName: 'Scenario Group';
    pluralName: 'scenario-groups';
    singularName: 'scenario-group';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scenario-group.scenario-group'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    scenarios: Schema.Attribute.Relation<'oneToMany', 'api::scenario.scenario'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScenarioScenario extends Struct.CollectionTypeSchema {
  collectionName: 'scenarios';
  info: {
    description: '';
    displayName: 'Scenario';
    pluralName: 'scenarios';
    singularName: 'scenario';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    group: Schema.Attribute.Relation<
      'manyToOne',
      'api::scenario-group.scenario-group'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scenario.scenario'
    > &
      Schema.Attribute.Private;
    postActions: Schema.Attribute.Relation<
      'oneToMany',
      'api::post-scenario-action.post-scenario-action'
    >;
    publishedAt: Schema.Attribute.DateTime;
    queries: Schema.Attribute.Relation<'oneToMany', 'api::query.query'>;
    queryParameters: Schema.Attribute.Relation<
      'oneToMany',
      'api::query-parameter.query-parameter'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2CanvasLabelSettingV2CanvasLabelSetting
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_canvas_label_settings';
  info: {
    displayName: 'V2 Canvas Node Setting';
    pluralName: 'v2-canvas-label-settings';
    singularName: 'v2-canvas-label-setting';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canvas: Schema.Attribute.Relation<'manyToOne', 'api::v2-canvas.v2-canvas'>;
    colorIndex: Schema.Attribute.Enumeration<
      ['color0', 'color1', 'color2', 'color3', 'color4', 'color5']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customColorIndex: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    customRadius: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-canvas-label-setting.v2-canvas-label-setting'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    radius: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2CanvasV2Canvas extends Struct.CollectionTypeSchema {
  collectionName: 'v2_canvases';
  info: {
    description: '';
    displayName: 'V2 Canvas';
    pluralName: 'v2-canvases';
    singularName: 'v2-canvas';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    compressRelationshipsWidthFactor: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    graph: Schema.Attribute.Media<'files'>;
    growNodesBasedOnDegree: Schema.Attribute.Boolean;
    growNodesBasedOnDegreeFactor: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-canvas.v2-canvas'
    > &
      Schema.Attribute.Private;
    nodeSettings: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-canvas-label-setting.v2-canvas-label-setting'
    >;
    publishedAt: Schema.Attribute.DateTime;
    room: Schema.Attribute.Relation<'manyToOne', 'api::v2-room.v2-room'>;
    scaleType: Schema.Attribute.Enumeration<
      ['linear', 'log2', 'logn', 'log10']
    >;
    title: Schema.Attribute.String;
    treatNameInQueryAsLabel: Schema.Attribute.Boolean;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2CommonPropertyV2CommonProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_common_properties';
  info: {
    displayName: 'V2 Common Property';
    pluralName: 'v2-common-properties';
    singularName: 'v2-common-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    leftDatabase: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-database-connection.v2-database-connection'
    >;
    leftLabel: Schema.Attribute.String;
    leftProperty: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-common-property.v2-common-property'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-project.v2-project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rightDatabase: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-database-connection.v2-database-connection'
    >;
    rightLabel: Schema.Attribute.String;
    rightProperty: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2DatabaseConnectionV2DatabaseConnection
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_database_connections';
  info: {
    description: '';
    displayName: 'V2 Database Connection';
    pluralName: 'v2-database-connections';
    singularName: 'v2-database-connection';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    browserUrl: Schema.Attribute.String;
    commonPropertiesLeft: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-common-property.v2-common-property'
    >;
    commonPropertiesRight: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-common-property.v2-common-property'
    >;
    connectionUrl: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.String;
    linkProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-link-property.v2-link-property'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-database-connection.v2-database-connection'
    > &
      Schema.Attribute.Private;
    nodeTitleProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-node-title-property.v2-node-title-property'
    >;
    password: Schema.Attribute.String;
    project: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-project.v2-project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    queries: Schema.Attribute.Relation<'oneToMany', 'api::v2-query.v2-query'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiV2LinkPropertyV2LinkProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_link_properties';
  info: {
    displayName: 'V2 Link Property';
    pluralName: 'v2-link-properties';
    singularName: 'v2-link-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-database-connection.v2-database-connection'
    >;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-link-property.v2-link-property'
    > &
      Schema.Attribute.Private;
    property: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
  };
}

export interface ApiV2NodeReferenceV2NodeReference
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_node_references';
  info: {
    displayName: 'V2 Node Reference';
    pluralName: 'v2-node-references';
    singularName: 'v2-node-reference';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-node-reference.v2-node-reference'
    > &
      Schema.Attribute.Private;
    nodeId: Schema.Attribute.String;
    note: Schema.Attribute.Relation<'manyToOne', 'api::v2-note.v2-note'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2NodeTitlePropertyV2NodeTitleProperty
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_node_title_properties';
  info: {
    displayName: 'V2 Node Title Property';
    pluralName: 'v2-node-title-properties';
    singularName: 'v2-node-title-property';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-database-connection.v2-database-connection'
    >;
    label: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-node-title-property.v2-node-title-property'
    > &
      Schema.Attribute.Private;
    property: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2NoteV2Note extends Struct.CollectionTypeSchema {
  collectionName: 'v2_notes';
  info: {
    description: '';
    displayName: 'V2 Note';
    pluralName: 'v2-notes';
    singularName: 'v2-note';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    content: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-note.v2-note'
    > &
      Schema.Attribute.Private;
    nodes: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-node-reference.v2-node-reference'
    >;
    project: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-project.v2-project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2PostScenarioActionV2PostScenarioAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_post_scenario_actions';
  info: {
    displayName: 'V2 Post Scenario Action';
    pluralName: 'v2-post-scenario-actions';
    singularName: 'v2-post-scenario-action';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    circleRadius: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    label: Schema.Attribute.String;
    layoutAlgorithm: Schema.Attribute.Enumeration<['forceDirected', 'circle']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-post-scenario-action.v2-post-scenario-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scenario: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-scenario.v2-scenario'
    >;
    type: Schema.Attribute.Enumeration<
      ['connectResultNodes', 'compressRelationships', 'compressNodes', 'layout']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2ProjectV2Project extends Struct.CollectionTypeSchema {
  collectionName: 'v2_projects';
  info: {
    description: '';
    displayName: 'V2 Project';
    pluralName: 'v2-projects';
    singularName: 'v2-project';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    collaborators: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    commonProperties: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-common-property.v2-common-property'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    databaseConnections: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-database-connection.v2-database-connection'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-project.v2-project'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::v2-note.v2-note'>;
    owner: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rooms: Schema.Attribute.Relation<'oneToMany', 'api::v2-room.v2-room'>;
    scenarioGroups: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-scenario-group.v2-scenario-group'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2QueryParameterV2QueryParameter
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_query_parameters';
  info: {
    displayName: 'V2 Query Parameter';
    pluralName: 'v2-query-parameters';
    singularName: 'v2-query-parameter';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataType: Schema.Attribute.Enumeration<
      ['string', 'number', 'json', 'startDateTime', 'endDateTime']
    > &
      Schema.Attribute.DefaultTo<'string'>;
    defaultValue: Schema.Attribute.String;
    identifier: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-query-parameter.v2-query-parameter'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scenario: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-scenario.v2-scenario'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2QueryV2Query extends Struct.CollectionTypeSchema {
  collectionName: 'v2_queries';
  info: {
    displayName: 'V2 Query';
    pluralName: 'v2-queries';
    singularName: 'v2-query';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    database: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-database-connection.v2-database-connection'
    >;
    isTableQuery: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-query.v2-query'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    query: Schema.Attribute.String;
    scenario: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-scenario.v2-scenario'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2RoomV2Room extends Struct.CollectionTypeSchema {
  collectionName: 'v2_rooms';
  info: {
    description: '';
    displayName: 'V2 Room';
    pluralName: 'v2-rooms';
    singularName: 'v2-room';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    canvases: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-canvas.v2-canvas'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-room.v2-room'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-project.v2-project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visibility: Schema.Attribute.Enumeration<
      ['private', 'unlisted', 'public']
    > &
      Schema.Attribute.DefaultTo<'private'>;
  };
}

export interface ApiV2ScenarioGroupV2ScenarioGroup
  extends Struct.CollectionTypeSchema {
  collectionName: 'v2_scenario_groups';
  info: {
    description: '';
    displayName: 'V2 Scenario Group';
    pluralName: 'v2-scenario-groups';
    singularName: 'v2-scenario-group';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-scenario-group.v2-scenario-group'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-project.v2-project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    scenarios: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-scenario.v2-scenario'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiV2ScenarioV2Scenario extends Struct.CollectionTypeSchema {
  collectionName: 'v2_scenarios';
  info: {
    description: '';
    displayName: 'V2 Scenario';
    pluralName: 'v2-scenarios';
    singularName: 'v2-scenario';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    group: Schema.Attribute.Relation<
      'manyToOne',
      'api::v2-scenario-group.v2-scenario-group'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-scenario.v2-scenario'
    > &
      Schema.Attribute.Private;
    postActions: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-post-scenario-action.v2-post-scenario-action'
    >;
    publishedAt: Schema.Attribute.DateTime;
    queries: Schema.Attribute.Relation<'oneToMany', 'api::v2-query.v2-query'>;
    queryParameters: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-query-parameter.v2-query-parameter'
    >;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::v2-note.v2-note'>;
    notes2: Schema.Attribute.Relation<'oneToMany', 'api::note.note'>;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    projectCollaborations: Schema.Attribute.Relation<
      'manyToMany',
      'api::v2-project.v2-project'
    >;
    projectCollaborations2: Schema.Attribute.Relation<
      'manyToMany',
      'api::project.project'
    >;
    projects: Schema.Attribute.Relation<
      'oneToMany',
      'api::v2-project.v2-project'
    >;
    projects2: Schema.Attribute.Relation<'oneToMany', 'api::project.project'>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::canvas-label-setting.canvas-label-setting': ApiCanvasLabelSettingCanvasLabelSetting;
      'api::canvas.canvas': ApiCanvasCanvas;
      'api::common-property.common-property': ApiCommonPropertyCommonProperty;
      'api::database-connection.database-connection': ApiDatabaseConnectionDatabaseConnection;
      'api::link-property.link-property': ApiLinkPropertyLinkProperty;
      'api::node-reference.node-reference': ApiNodeReferenceNodeReference;
      'api::node-title-property.node-title-property': ApiNodeTitlePropertyNodeTitleProperty;
      'api::note.note': ApiNoteNote;
      'api::post-scenario-action.post-scenario-action': ApiPostScenarioActionPostScenarioAction;
      'api::project.project': ApiProjectProject;
      'api::query-parameter.query-parameter': ApiQueryParameterQueryParameter;
      'api::query.query': ApiQueryQuery;
      'api::room.room': ApiRoomRoom;
      'api::scenario-group.scenario-group': ApiScenarioGroupScenarioGroup;
      'api::scenario.scenario': ApiScenarioScenario;
      'api::v2-canvas-label-setting.v2-canvas-label-setting': ApiV2CanvasLabelSettingV2CanvasLabelSetting;
      'api::v2-canvas.v2-canvas': ApiV2CanvasV2Canvas;
      'api::v2-common-property.v2-common-property': ApiV2CommonPropertyV2CommonProperty;
      'api::v2-database-connection.v2-database-connection': ApiV2DatabaseConnectionV2DatabaseConnection;
      'api::v2-link-property.v2-link-property': ApiV2LinkPropertyV2LinkProperty;
      'api::v2-node-reference.v2-node-reference': ApiV2NodeReferenceV2NodeReference;
      'api::v2-node-title-property.v2-node-title-property': ApiV2NodeTitlePropertyV2NodeTitleProperty;
      'api::v2-note.v2-note': ApiV2NoteV2Note;
      'api::v2-post-scenario-action.v2-post-scenario-action': ApiV2PostScenarioActionV2PostScenarioAction;
      'api::v2-project.v2-project': ApiV2ProjectV2Project;
      'api::v2-query-parameter.v2-query-parameter': ApiV2QueryParameterV2QueryParameter;
      'api::v2-query.v2-query': ApiV2QueryV2Query;
      'api::v2-room.v2-room': ApiV2RoomV2Room;
      'api::v2-scenario-group.v2-scenario-group': ApiV2ScenarioGroupV2ScenarioGroup;
      'api::v2-scenario.v2-scenario': ApiV2ScenarioV2Scenario;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
