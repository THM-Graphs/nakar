import { LiveCanvasViewSettingsDto } from '../../schema/dtos/LiveCanvasViewSettingsDto';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import { LiveCanvasEdgeViewSettingsDto } from '../../schema/dtos/LiveCanvasEdgeViewSettingsDto';
import { Range } from '../../../packages/range/Range';
import { ScaleType } from '../../../packages/range/ScaleType';
import { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import { LiveCanvasViewSettingsColorIndex } from './LiveCanvasViewSettingsColorIndex';
import { LiveCanvasViewSettingsDefaultValues } from './LiveCanvasViewSettingsDefaultValues';
import { LiveCanvasViewSettingsFactory } from './LiveCanvasViewSettingsFactory';
import { LiveCanvasViewSettingsMapper } from './LiveCanvasViewSettingsMapper';
import { LiveCanvasViewSettingsMerger } from './LiveCanvasViewSettingsMerger';
import { LiveCanvasViewSettingsPlain } from './LiveCanvasViewSettingsPlain';
import { LiveCanvasViewSettingsResolver } from './LiveCanvasViewSettingsResolver';
import { LiveCanvasViewSettingsValidator } from './LiveCanvasViewSettingsValidator';
import { liveCanvasViewSettingsSchema } from './liveCanvasViewSettingsSchema';
import { LiveCanvasViewSettingsState } from './LiveCanvasViewSettingsState';

/**
 * Helper object that keeps the composed view settings collaborators together.
 */
interface LiveCanvasViewSettingsComponents {
  /**
   * Factory used for complete default states and subobjects.
   */
  factory: LiveCanvasViewSettingsFactory;

  /**
   * Mapper used for DTO and persistence conversion.
   */
  mapper: LiveCanvasViewSettingsMapper;

  /**
   * Merger used for copy and merge operations.
   */
  merger: LiveCanvasViewSettingsMerger;

  /**
   * Resolver used for materializing missing label and edge settings.
   */
  resolver: LiveCanvasViewSettingsResolver;
}

/**
 * Creates the collaborating helper objects used by one settings instance.
 */
function createLiveCanvasViewSettingsComponents(
  defaultValues: LiveCanvasViewSettingsDefaultValues,
  factorRange: Range,
): LiveCanvasViewSettingsComponents {
  const factory: LiveCanvasViewSettingsFactory =
    new LiveCanvasViewSettingsFactory(defaultValues);
  const validator: LiveCanvasViewSettingsValidator =
    new LiveCanvasViewSettingsValidator(factorRange);
  const mapper: LiveCanvasViewSettingsMapper = new LiveCanvasViewSettingsMapper(
    defaultValues,
    validator,
  );
  const merger: LiveCanvasViewSettingsMerger =
    new LiveCanvasViewSettingsMerger();
  const resolver: LiveCanvasViewSettingsResolver =
    new LiveCanvasViewSettingsResolver(factory);

  return {
    factory: factory,
    mapper: mapper,
    merger: merger,
    resolver: resolver,
  };
}

/**
 * Public facade for the materialized view settings of a live canvas.
 *
 * The class keeps the existing API stable while delegating creation, mapping,
 * merging, validation, and resolve-or-create behavior to focused helper
 * classes.
 */
export class LiveCanvasViewSettings {
  /**
   * Supported range for global numeric visualization factors.
   */
  public static readonly factorRange: Range = new Range({
    floor: 1,
    ceiling: 1000,
  });

  /**
   * Zod schema used for persisted plain view settings data.
   */
  public static readonly schema: typeof liveCanvasViewSettingsSchema =
    liveCanvasViewSettingsSchema;

  /**
   * Shared default values for all view settings instances.
   */
  private static readonly _defaultValues: LiveCanvasViewSettingsDefaultValues =
    new LiveCanvasViewSettingsDefaultValues();

  /**
   * Runtime state that stores complete global, label, and edge settings.
   */
  private _state: LiveCanvasViewSettingsState;

  /**
   * Maps state to and from persistence and API DTO representations.
   */
  private readonly _mapper: LiveCanvasViewSettingsMapper;

  /**
   * Copies and merges complete state objects.
   */
  private readonly _merger: LiveCanvasViewSettingsMerger;

  /**
   * Resolves label and edge settings and materializes missing subobjects.
   */
  private readonly _resolver: LiveCanvasViewSettingsResolver;

  /**
   * Creates an instance from an already normalized runtime state.
   */
  public constructor(
    state: LiveCanvasViewSettingsState,
    factory: LiveCanvasViewSettingsFactory = new LiveCanvasViewSettingsFactory(
      LiveCanvasViewSettings._defaultValues,
    ),
    mapper: LiveCanvasViewSettingsMapper = new LiveCanvasViewSettingsMapper(
      LiveCanvasViewSettings._defaultValues,
      new LiveCanvasViewSettingsValidator(LiveCanvasViewSettings.factorRange),
    ),
    merger: LiveCanvasViewSettingsMerger = new LiveCanvasViewSettingsMerger(),
    resolver: LiveCanvasViewSettingsResolver = new LiveCanvasViewSettingsResolver(
      factory,
    ),
  ) {
    this._mapper = mapper;
    this._merger = merger;
    this._resolver = resolver;
    this._state = this._merger.copyState(state);
  }

  /**
   * Returns the relationship width compression factor.
   */
  public get compressRelationshipsWidthFactor(): number {
    return this._state.compressRelationshipsWidthFactor;
  }

  /**
   * Returns whether node radius should grow based on node degree.
   */
  public get growNodesBasedOnDegree(): boolean {
    return this._state.growNodesBasedOnDegree;
  }

  /**
   * Returns the degree-based node radius growth factor.
   */
  public get growNodesBasedOnDegreeFactor(): number {
    return this._state.growNodesBasedOnDegreeFactor;
  }

  /**
   * Returns the scale type used for numeric visual scaling.
   */
  public get scaleType(): ScaleType {
    return this._state.scaleType;
  }

  /**
   * Returns the materialized label settings dictionary.
   */
  public get labelSettings(): Record<
    string,
    LiveCanvasLabelViewSettingsState | undefined
  > {
    return this._state.labelSettings;
  }

  /**
   * Returns the materialized edge settings dictionary.
   */
  public get edgeSettings(): Record<
    string,
    LiveCanvasEdgeViewSettingsState | undefined
  > {
    return this._state.edgeSettings;
  }

  /**
   * Creates view settings from persisted plain data.
   */
  public static fromPlain(
    data: LiveCanvasViewSettingsPlain,
  ): LiveCanvasViewSettings {
    const components: LiveCanvasViewSettingsComponents =
      createLiveCanvasViewSettingsComponents(
        LiveCanvasViewSettings._defaultValues,
        LiveCanvasViewSettings.factorRange,
      );
    return new LiveCanvasViewSettings(
      components.mapper.stateFromPlain(data),
      components.factory,
      components.mapper,
      components.merger,
      components.resolver,
    );
  }

  /**
   * Creates view settings from the public API DTO and known graph metadata.
   */
  public static fromSchema(
    input: LiveCanvasViewSettingsDto,
    labels: string[],
    edgeTypes: string[],
  ): LiveCanvasViewSettings {
    const components: LiveCanvasViewSettingsComponents =
      createLiveCanvasViewSettingsComponents(
        LiveCanvasViewSettings._defaultValues,
        LiveCanvasViewSettings.factorRange,
      );
    return new LiveCanvasViewSettings(
      components.mapper.stateFromSchema(input, labels, edgeTypes),
      components.factory,
      components.mapper,
      components.merger,
      components.resolver,
    );
  }

  /**
   * Creates default view settings without any label or edge subobjects.
   */
  public static defaultViewSettings(): LiveCanvasViewSettings {
    const components: LiveCanvasViewSettingsComponents =
      createLiveCanvasViewSettingsComponents(
        LiveCanvasViewSettings._defaultValues,
        LiveCanvasViewSettings.factorRange,
      );
    return new LiveCanvasViewSettings(
      components.factory.createDefaultState(),
      components.factory,
      components.mapper,
      components.merger,
      components.resolver,
    );
  }

  /**
   * Merges another view settings instance into this instance.
   */
  public mergeWith(other: LiveCanvasViewSettings): void {
    this._state = this._merger.mergeStates(this._state, other._state);
  }

  /**
   * Enables degree-based node growth and stores a clamped factor.
   */
  public setGrowNodesBasedOnDegreeFactor(factor: number): void {
    this._state.growNodesBasedOnDegree = true;
    this._state.growNodesBasedOnDegreeFactor =
      LiveCanvasViewSettings.factorRange.clamp(factor);
  }

  /**
   * Stores a clamped relationship width compression factor.
   */
  public setCompressRelationshipsWidthFactor(factor: number): void {
    this._state.compressRelationshipsWidthFactor =
      LiveCanvasViewSettings.factorRange.clamp(factor);
  }

  /**
   * Sets the materialized color index for a label.
   */
  public setLabelColorIndex(
    label: string,
    colorIndex: LiveCanvasViewSettingsColorIndex,
  ): void {
    this.getLabelSettings(label).colorIndex = colorIndex;
  }

  /**
   * Sets a custom radius for a label and marks the radius as custom.
   */
  public setCustomLabelRadius(label: string, radius: number): void {
    const labelSettings: LiveCanvasLabelViewSettingsState =
      this.getLabelSettings(label);
    labelSettings.radius = radius;
    labelSettings.customRadius = true;
  }

  /**
   * Sets a custom title property for a label and marks it as custom.
   */
  public setCustomLabelTitleProperty(
    label: string,
    titleProperty: string,
  ): void {
    const labelSettings: LiveCanvasLabelViewSettingsState =
      this.getLabelSettings(label);
    labelSettings.titleProperty = titleProperty;
    labelSettings.customTitleProperty = true;
  }

  /**
   * Sets a custom color for an edge type and marks the color as custom.
   */
  public setCustomEdgeColorIndex(
    edgeType: string,
    colorIndex: LiveCanvasViewSettingsColorIndex,
  ): void {
    const edgeSettings: LiveCanvasEdgeViewSettingsState =
      this.getEdgeSettings(edgeType);
    edgeSettings.colorIndex = colorIndex;
    edgeSettings.customColor = true;
  }

  /**
   * Sets a custom width for an edge type and marks the width as custom.
   */
  public setCustomEdgeWidth(edgeType: string, width: number): void {
    const edgeSettings: LiveCanvasEdgeViewSettingsState =
      this.getEdgeSettings(edgeType);
    edgeSettings.width = width;
    edgeSettings.customWidth = true;
  }

  /**
   * Converts the current settings into the public API DTO shape.
   */
  public toSchema(
    labels: string[],
    edgeTypes: string[],
  ): LiveCanvasViewSettingsDto {
    return {
      compressRelationshipsWidthFactor: this.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this.growNodesBasedOnDegreeFactor,
      labelSettings: labels.map(
        (label: string): LiveCanvasLabelViewSettingsDto => {
          const viewSetting: LiveCanvasLabelViewSettingsState =
            this.getLabelSettings(label);
          return {
            label: label,
            colorIndex: viewSetting.colorIndex,
            customRadius: viewSetting.customRadius,
            radius: viewSetting.radius,
            titleProperty: viewSetting.titleProperty,
            customTitleProperty: viewSetting.customTitleProperty,
          } satisfies LiveCanvasLabelViewSettingsDto;
        },
      ),
      edgeSettings: edgeTypes.map(
        (edgeType: string): LiveCanvasEdgeViewSettingsDto => {
          const viewSetting: LiveCanvasEdgeViewSettingsState =
            this.getEdgeSettings(edgeType);
          return {
            edgeType: edgeType,
            width: viewSetting.width,
            customWidth: viewSetting.customWidth,
            colorIndex: viewSetting.colorIndex,
            customColor: viewSetting.customColor,
          } satisfies LiveCanvasEdgeViewSettingsDto;
        },
      ),
    };
  }

  /**
   * Converts the current settings into the persisted plain shape.
   */
  public toPlain(): LiveCanvasViewSettingsPlain {
    return this._mapper.toPlain(this._state);
  }

  /**
   * Returns materialized label settings, creating them when missing.
   */
  public getLabelSettings(label: string): LiveCanvasLabelViewSettingsState {
    return this._resolver.resolveLabelSettings(this._state, label);
  }

  /**
   * Returns materialized edge settings, creating them when missing.
   */
  public getEdgeSettings(edgeType: string): LiveCanvasEdgeViewSettingsState {
    return this._resolver.resolveEdgeSettings(this._state, edgeType);
  }
}
