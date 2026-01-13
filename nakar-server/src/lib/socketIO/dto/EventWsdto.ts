/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';
import { IsDefined, ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { match } from 'ts-pattern';
import { BadRequestException } from '@nestjs/common';
import { CanvasChangedWsdto } from './events/CanvasChangedWsdto';
import { CanvasDataReadyWsdto } from './events/CanvasDataReadyWsdto';
import { ClearProgressWsdto } from './events/ClearProgressWsdto';
import { GraphElementsChangedWsdto } from './events/GraphElementsChangedWsdto';
import { GraphMetaDataChangedWsdto } from './events/GraphMetaDataChangedWsdto';
import { GraphTableDataChangedWsdto } from './events/GraphTableDataChangedWsdto';
import { KickWsdto } from './events/KickWsdto';
import { NodesMovedWsdto } from './events/NodesMovedWsdto';
import { NotificationWsdto } from './events/NotificationWsdto';
import { ProgressWsdto } from './events/ProgressWsdto';
import { SetNodeLocksWsdto } from './events/SetNodeLocksWsdto';
import { ViewSettingsChangedWsdto } from './events/ViewSettingsChangedWsdto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const events: Function[] = [
  CanvasChangedWsdto,
  CanvasDataReadyWsdto,
  ClearProgressWsdto,
  GraphElementsChangedWsdto,
  GraphMetaDataChangedWsdto,
  GraphTableDataChangedWsdto,
  KickWsdto,
  NodesMovedWsdto,
  NotificationWsdto,
  ProgressWsdto,
  SetNodeLocksWsdto,
  ViewSettingsChangedWsdto,
];

@ApiExtraModels(...events)
export class EventWsdto {
  @ApiProperty({
    oneOf: refs(...events),
  })
  @ValidateNested()
  @IsDefined()
  @Type((options: TypeHelpOptions | undefined) =>
    match(options?.object['event'])
      .with({ type: 'CanvasChangedWsdto' }, () => CanvasChangedWsdto)
      .with({ type: 'CanvasDataReadyWsdto' }, () => CanvasDataReadyWsdto)
      .with({ type: 'ClearProgressWsdto' }, () => ClearProgressWsdto)
      .with(
        { type: 'GraphElementsChangedWsdto' },
        () => GraphElementsChangedWsdto,
      )
      .with(
        { type: 'GraphMetaDataChangedWsdto' },
        () => GraphMetaDataChangedWsdto,
      )
      .with(
        { type: 'GraphTableDataChangedWsdto' },
        () => GraphTableDataChangedWsdto,
      )
      .with({ type: 'KickWsdto' }, () => KickWsdto)
      .with({ type: 'NodesMovedWsdto' }, () => NodesMovedWsdto)
      .with({ type: 'NotificationWsdto' }, () => NotificationWsdto)
      .with({ type: 'ProgressWsdto' }, () => ProgressWsdto)
      .with({ type: 'SetNodeLocksWsdto' }, () => SetNodeLocksWsdto)
      .with(
        { type: 'ViewSettingsChangedWsdto' },
        () => ViewSettingsChangedWsdto,
      )
      .otherwise(() => {
        throw new BadRequestException();
      }),
  )
  public event!:
    | CanvasChangedWsdto
    | CanvasDataReadyWsdto
    | ClearProgressWsdto
    | GraphElementsChangedWsdto
    | GraphMetaDataChangedWsdto
    | GraphTableDataChangedWsdto
    | KickWsdto
    | NodesMovedWsdto
    | NotificationWsdto
    | ProgressWsdto
    | SetNodeLocksWsdto
    | ViewSettingsChangedWsdto;
}
