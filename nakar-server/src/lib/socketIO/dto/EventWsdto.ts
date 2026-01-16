/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';
import { IsDefined, ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { match } from 'ts-pattern';
import { BadRequestException } from '@nestjs/common';
import { CanvasChangedWsdto } from './events/CanvasChangedWsdto';
import { CanvasDataReadyWsdto } from './events/CanvasDataReadyWsdto';
import { ClearProgressWsdto } from './events/ClearProgressWsdto';
import { CanvasElementsChangedWsdto } from './events/CanvasElementsChangedWsdto';
import { CanvasMetaDataChangedWsdto } from './events/CanvasMetaDataChangedWsdto';
import { CanvasTableDataChangedWsdto } from './events/CanvasTableDataChangedWsdto';
import { KickWsdto } from './events/KickWsdto';
import { NodesMovedWsdto } from './events/NodesMovedWsdto';
import { NotificationWsdto } from './events/NotificationWsdto';
import { ProgressWsdto } from './events/ProgressWsdto';
import { SetNodeLocksWsdto } from './events/SetNodeLocksWsdto';
import { CanvasViewSettingsChangedWsdto } from './events/CanvasViewSettingsChangedWsdto';
import { CanvasHistogramChangedWsdto } from './events/CanvasHistogramChangedWsdto';
import { CanvasNotesChangedWsdto } from './events/CanvasNotesChangedWsdto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const events: Function[] = [
  CanvasChangedWsdto,
  CanvasDataReadyWsdto,
  ClearProgressWsdto,
  CanvasElementsChangedWsdto,
  CanvasMetaDataChangedWsdto,
  CanvasTableDataChangedWsdto,
  CanvasHistogramChangedWsdto,
  CanvasNotesChangedWsdto,
  KickWsdto,
  NodesMovedWsdto,
  NotificationWsdto,
  ProgressWsdto,
  SetNodeLocksWsdto,
  CanvasViewSettingsChangedWsdto,
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
        () => CanvasElementsChangedWsdto,
      )
      .with(
        { type: 'GraphMetaDataChangedWsdto' },
        () => CanvasMetaDataChangedWsdto,
      )
      .with(
        { type: 'GraphTableDataChangedWsdto' },
        () => CanvasTableDataChangedWsdto,
      )
      .with(
        { type: 'CanvasHistogramChangedWsdto' },
        () => CanvasHistogramChangedWsdto,
      )
      .with({ type: 'CanvasNotesChangedWsdto' }, () => CanvasNotesChangedWsdto)
      .with({ type: 'KickWsdto' }, () => KickWsdto)
      .with({ type: 'NodesMovedWsdto' }, () => NodesMovedWsdto)
      .with({ type: 'NotificationWsdto' }, () => NotificationWsdto)
      .with({ type: 'ProgressWsdto' }, () => ProgressWsdto)
      .with({ type: 'SetNodeLocksWsdto' }, () => SetNodeLocksWsdto)
      .with(
        { type: 'ViewSettingsChangedWsdto' },
        () => CanvasViewSettingsChangedWsdto,
      )
      .otherwise(() => {
        throw new BadRequestException();
      }),
  )
  public event!:
    | CanvasChangedWsdto
    | CanvasDataReadyWsdto
    | ClearProgressWsdto
    | CanvasElementsChangedWsdto
    | CanvasMetaDataChangedWsdto
    | CanvasTableDataChangedWsdto
    | CanvasHistogramChangedWsdto
    | CanvasNotesChangedWsdto
    | KickWsdto
    | NodesMovedWsdto
    | NotificationWsdto
    | ProgressWsdto
    | SetNodeLocksWsdto
    | CanvasViewSettingsChangedWsdto;
}
