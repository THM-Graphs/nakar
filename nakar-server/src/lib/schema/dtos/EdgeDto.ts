import { NodePreviewDto } from './NodePreviewDto';
import { CreationReasonDto } from './CreationReasonDto';
import { ApiProperty } from '@nestjs/swagger';

export class EdgeDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public startNodeId: string;

  @ApiProperty()
  public endNodeId: string;

  @ApiProperty()
  public type: string;

  @ApiProperty()
  public isLoop: boolean;

  @ApiProperty()
  public parallelCount: number;

  @ApiProperty()
  public parallelIndex: number;

  @ApiProperty()
  public isCluster: boolean;

  @ApiProperty()
  public width: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  public properties: Record<string, unknown>;

  @ApiProperty({ type: [String] })
  public namesInQuery: string[];

  @ApiProperty()
  public source: string;

  @ApiProperty()
  public clusterSize: number;

  @ApiProperty()
  public sourceNode: NodePreviewDto;

  @ApiProperty()
  public targetNode: NodePreviewDto;

  @ApiProperty({ enum: CreationReasonDto })
  public creationReason: CreationReasonDto;

  public constructor(data: {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    isLoop: boolean;
    parallelCount: number;
    parallelIndex: number;
    isCluster: boolean;
    width: number;
    properties: Record<string, unknown>;
    namesInQuery: string[];
    source: string;
    clusterSize: number;
    sourceNode: NodePreviewDto;
    targetNode: NodePreviewDto;
    creationReason: CreationReasonDto;
  }) {
    this.id = data.id;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.isLoop = data.isLoop;
    this.parallelCount = data.parallelCount;
    this.parallelIndex = data.parallelIndex;
    this.isCluster = data.isCluster;
    this.width = data.width;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.source = data.source;
    this.clusterSize = data.clusterSize;
    this.sourceNode = data.sourceNode;
    this.targetNode = data.targetNode;
    this.creationReason = data.creationReason;
  }
}
