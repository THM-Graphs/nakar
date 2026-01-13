import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { LoadScenarioRequestBodyDto } from './dto/LoadScenarioRequestBodyDto';
import { UserCanAccessCanvas } from '../../guards/UserCanAccessCanvas';
import { SMap } from '../../../map/Map';
import { CanvasService } from '../../../room/CanvasService';
import { ExpandNodeRequestBodyDto } from './dto/ExpandNodeRequestBodyDto';
import { SSet } from '../../../set/Set';
import { DeleteElementsRequestBodyDto } from './dto/DeleteElementsRequestBodyDto';
import { ScenarioArgumentDto } from './dto/ScenarioArgumentDto';
import { UnlockNodesRequestBodyDto } from './dto/UnlockNodesRequestBodyDto';
import { FocusNodesRequestBodyDto } from './dto/FocusNodesRequestBodyDto';
import { RunQueryRequestBodyDto } from './dto/RunQueryRequestBodyDto';
import { CompressNodesRequestBodyDto } from './dto/CompressNodesRequestBodyDto';
import { LayoutLabelRequestBodyDto } from './dto/LayoutLabelRequestBodyDto';
import { ShowShortestPathRequestBodyDto } from './dto/ShowShortestPathRequestBodyDto';
import { LoadNodeRequestBodyDto } from './dto/LoadNodeRequestBodyDto';
import { LiveCanvasViewSettingsDto } from '../../../schema/dtos/LiveCanvasViewSettingsDto';
import { LiveCanvasViewSettings } from '../../../room/data/LiveCanvasViewSettings';

@Controller('canvas/:canvasId/actions')
@ApiParam({
  name: 'canvasId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessCanvas)
export class ActionController {
  public constructor(private readonly _roomService: CanvasService) {}

  @Post('load-scenario')
  @HttpCode(200)
  @ApiBody({ type: LoadScenarioRequestBodyDto })
  public loadScenario(
    @Body() body: LoadScenarioRequestBodyDto,
    @Param('canvasId') canvasId: string,
  ): void {
    const scenarioId: string = body.scenarioId;
    const args: readonly ScenarioArgumentDto[] = body.arguments;

    const scenarioArgs: SMap<string, string> = args.reduce(
      (
        akku: SMap<string, string>,
        next: ScenarioArgumentDto,
      ): SMap<string, string> => {
        return akku.bySetting(next.identifier, next.value);
      },
      new SMap<string, string>(),
    );

    this._roomService.getCanvasWithId(canvasId).loadScenario({
      scenarioId: scenarioId,
      arguments: scenarioArgs,
      additive: body.additive,
    });
  }

  @Post('reload-scenario')
  @HttpCode(200)
  public reloadScenario(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).reloadScenario();
  }

  @Post('expand-node')
  @HttpCode(200)
  @ApiBody({ type: ExpandNodeRequestBodyDto })
  public expandNode(
    @Body() body: ExpandNodeRequestBodyDto,
    @Param('canvasId') canvasId: string,
  ): void {
    this._roomService.getCanvasWithId(canvasId).expandNode({
      nodeIds: body.nodeIds,
      limit:
        body.limit != null
          ? {
              relationships: new SSet(body.limit.relationships),
              labels: new SSet(body.limit.labels),
            }
          : null,
    });
  }

  @Post('delete-elements')
  @HttpCode(200)
  public deleteElements(
    @Param('canvasId') canvasId: string,
    @Body() body: DeleteElementsRequestBodyDto,
  ): void {
    this._roomService.getCanvasWithId(canvasId).deleteElements({
      nodeIds: body.nodes,
      labels: body.labels,
      edgeIds: body.edges,
      edgeTypes: body.edgeTypes,
    });
  }

  @Post('relayout')
  @HttpCode(200)
  public relayout(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).relayout();
  }

  @Post('unlock-nodes')
  @HttpCode(200)
  public unlockNodes(
    @Param('canvasId') canvasId: string,
    @Body() body: UnlockNodesRequestBodyDto,
  ): void {
    this._roomService
      .getCanvasWithId(canvasId)
      .unlockNodes({ nodeIds: body.nodes });
  }

  @Post('focus-nodes')
  @HttpCode(200)
  public focusNodes(
    @Param('canvasId') canvasId: string,
    @Body() body: FocusNodesRequestBodyDto,
  ): void {
    this._roomService
      .getCanvasWithId(canvasId)
      .focusNodes({ nodeIds: body.nodes });
  }

  @Post('undo')
  @HttpCode(200)
  public undo(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).undo();
  }

  @Post('redo')
  @HttpCode(200)
  public redo(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).redo();
  }

  @Post('run-query')
  @HttpCode(200)
  public runQuery(
    @Param('canvasId') canvasId: string,
    @Body() body: RunQueryRequestBodyDto,
  ): void {
    this._roomService.getCanvasWithId(canvasId).runQuery({
      query: body.query,
      databaseId: body.databaseId,
      replace: body.replace,
    });
  }

  @Post('connect-result-nodes')
  @HttpCode(200)
  public connectResultNodes(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).connectResultNodes();
  }

  @Post('unlock-all-nodes')
  @HttpCode(200)
  public unlockAllNodes(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).unlockAllNodes();
  }

  @Post('remove-dangling-nodes')
  @HttpCode(200)
  public removeDanglingNodes(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).removeDanglingNodes();
  }

  @Post('compress-relationships')
  @HttpCode(200)
  public compressRelationships(@Param('canvasId') canvasId: string): void {
    this._roomService.getCanvasWithId(canvasId).compressRelationships();
  }

  @Post('compress-nodes')
  @HttpCode(200)
  public compressNodes(
    @Param('canvasId') canvasId: string,
    @Body() body: CompressNodesRequestBodyDto,
  ): void {
    this._roomService
      .getCanvasWithId(canvasId)
      .compressNodes({ label: body.label });
  }

  @Post('layout-label')
  @HttpCode(200)
  public layoutLabel(
    @Param('canvasId') canvasId: string,
    @Body() body: LayoutLabelRequestBodyDto,
  ): void {
    this._roomService.getCanvasWithId(canvasId).layoutLabel({
      label: body.label,
      layoutSpecification: body.layoutSpecification,
    });
  }

  @Post('show-shortest-path')
  @HttpCode(200)
  public showShortestPath(
    @Param('canvasId') canvasId: string,
    @Body() body: ShowShortestPathRequestBodyDto,
  ): void {
    this._roomService.getCanvasWithId(canvasId).showShortestPath({
      nodeIds: body.nodeIds,
    });
  }

  @Post('load-node')
  @HttpCode(200)
  public loadNode(
    @Param('canvasId') canvasId: string,
    @Body() body: LoadNodeRequestBodyDto,
  ): void {
    this._roomService.getCanvasWithId(canvasId).loadNode({
      nodeId: body.nodeId,
      databaseId: body.databaseId,
    });
  }

  @Post('set-view-settings')
  @HttpCode(200)
  public setViewSettings(
    @Param('canvasId') canvasId: string,
    @Body() body: LiveCanvasViewSettingsDto,
  ): void {
    this._roomService
      .getCanvasWithId(canvasId)
      .setViewSettings(LiveCanvasViewSettings.fromSchema(body));
  }
}
