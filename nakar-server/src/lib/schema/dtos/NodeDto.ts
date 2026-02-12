import { PositionDto } from './PositionDto';
import { ColorDto } from './ColorDto';
import { EdgePreviewDto } from './EdgePreviewDto';
import { CreationReasonDto } from './CreationReasonDto';
import { NoteDto } from './NoteDto';
import { ApiProperty } from '@nestjs/swagger';
import { ScenarioGroupDto } from './ScenarioGroupDto';

export class NodeDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ type: [String] })
  public labels: string[];

  @ApiProperty({ type: [String] })
  public nativeLabels: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  public properties: Record<string, unknown>;

  @ApiProperty()
  public radius: number;

  @ApiProperty()
  public position: PositionDto;

  @ApiProperty()
  public inDegree: number;

  @ApiProperty()
  public outDegree: number;

  @ApiProperty()
  public degree: number;

  @ApiProperty({ type: [String] })
  public namesInQuery: string[];

  @ApiProperty({ type: ColorDto, nullable: true })
  public customColor: ColorDto | null;

  @ApiProperty()
  public source: string;

  @ApiProperty()
  public sourceId: string;

  @ApiProperty()
  public locked: boolean;

  @ApiProperty()
  public isCluster: boolean;

  @ApiProperty()
  public clusterSize: number;

  @ApiProperty({ type: [EdgePreviewDto] })
  public incomingEdges: EdgePreviewDto[];

  @ApiProperty({ type: [EdgePreviewDto] })
  public outgoingEdges: EdgePreviewDto[];

  @ApiProperty({ enum: CreationReasonDto })
  public creationReason: CreationReasonDto;

  @ApiProperty({ type: [NoteDto] })
  public notes: NoteDto[];

  @ApiProperty({ isArray: true, type: ScenarioGroupDto })
  public parameterizedScenarios: ScenarioGroupDto[];

  @ApiProperty({ type: String, nullable: true })
  public coverImageUrl: string | null;

  public constructor(data: {
    id: string;
    title: string;
    labels: string[];
    nativeLabels: string[];
    properties: Record<string, unknown>;
    radius: number;
    position: PositionDto;
    inDegree: number;
    outDegree: number;
    degree: number;
    namesInQuery: string[];
    customColor: ColorDto | null;
    source: string;
    sourceId: string;
    locked: boolean;
    isCluster: boolean;
    clusterSize: number;
    incomingEdges: EdgePreviewDto[];
    outgoingEdges: EdgePreviewDto[];
    creationReason: CreationReasonDto;
    notes: NoteDto[];
    parameterizedScenarios: ScenarioGroupDto[];
    coverImageUrl: string | null;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.labels = data.labels;
    this.nativeLabels = data.nativeLabels;
    this.properties = data.properties;
    this.radius = data.radius;
    this.position = data.position;
    this.inDegree = data.inDegree;
    this.outDegree = data.outDegree;
    this.degree = data.degree;
    this.namesInQuery = data.namesInQuery;
    this.customColor = data.customColor;
    this.source = data.source;
    this.sourceId = data.sourceId;
    this.locked = data.locked;
    this.isCluster = data.isCluster;
    this.clusterSize = data.clusterSize;
    this.incomingEdges = data.incomingEdges;
    this.outgoingEdges = data.outgoingEdges;
    this.creationReason = data.creationReason;
    this.notes = data.notes;
    this.parameterizedScenarios = data.parameterizedScenarios;
    this.coverImageUrl = data.coverImageUrl;
  }
}
