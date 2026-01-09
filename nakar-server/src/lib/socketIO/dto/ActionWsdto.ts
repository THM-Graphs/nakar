/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GrabNodeWsdto } from './actions/GrabNodeWsdto';
import { JoinCanvasWsdto } from './actions/JoinCanvasWsdto';
import { LeaveCanvasWsdto } from './actions/LeaveCanvasWsdto';
import { MoveNodesWsdto } from './actions/MoveNodesWsdto';
import { UngrabNodeWsdto } from './actions/UngrabNodeWsdto';
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';
import { IsDefined, ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { match } from 'ts-pattern';
import { BadRequestException } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const actions: Function[] = [
  JoinCanvasWsdto,
  LeaveCanvasWsdto,
  GrabNodeWsdto,
  MoveNodesWsdto,
  UngrabNodeWsdto,
];

@ApiExtraModels(...actions)
export class ActionWsdto {
  @ApiProperty({
    oneOf: refs(...actions),
  })
  @ValidateNested()
  @IsDefined()
  @Type((options: TypeHelpOptions | undefined) =>
    match(options?.object['action'])
      .with({ type: 'JoinCanvasWsdto' }, () => JoinCanvasWsdto)
      .with({ type: 'LeaveCanvasWsdto' }, () => LeaveCanvasWsdto)
      .with({ type: 'GrabNodeWsdto' }, () => GrabNodeWsdto)
      .with({ type: 'MoveNodesWsdto' }, () => MoveNodesWsdto)
      .with({ type: 'UngrabNodeWsdto' }, () => UngrabNodeWsdto)
      .otherwise(() => {
        throw new BadRequestException();
      }),
  )
  public action!:
    | JoinCanvasWsdto
    | LeaveCanvasWsdto
    | GrabNodeWsdto
    | MoveNodesWsdto
    | UngrabNodeWsdto;
}
