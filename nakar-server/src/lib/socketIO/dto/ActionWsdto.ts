/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GrabNodeWsdto } from './actions/GrabNodeWsdto';
import { MoveNodesWsdto } from './actions/MoveNodesWsdto';
import { UngrabNodeWsdto } from './actions/UngrabNodeWsdto';
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';
import { IsDefined, ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { match } from 'ts-pattern';
import { BadRequestException } from '@nestjs/common';
import { MoveCursorWsdto } from './actions/MoveCursorWsdto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const actions: Function[] = [
  GrabNodeWsdto,
  MoveNodesWsdto,
  UngrabNodeWsdto,
  MoveCursorWsdto,
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
      .with({ type: 'GrabNodeWsdto' }, () => GrabNodeWsdto)
      .with({ type: 'MoveNodesWsdto' }, () => MoveNodesWsdto)
      .with({ type: 'UngrabNodeWsdto' }, () => UngrabNodeWsdto)
      .with({ type: 'MoveCursorWsdto' }, () => MoveCursorWsdto)
      .otherwise(() => {
        throw new BadRequestException();
      }),
  )
  public action!:
    | GrabNodeWsdto
    | MoveNodesWsdto
    | UngrabNodeWsdto
    | MoveCursorWsdto;
}
