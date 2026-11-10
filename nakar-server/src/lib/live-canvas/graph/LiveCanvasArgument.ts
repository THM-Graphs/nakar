import type { LiveCanvasParameterDataType } from './LiveCanvasParameterDataType';

export class LiveCanvasArgument {
  private readonly _identifier: string;
  private readonly _value: unknown;
  private readonly _dataType: LiveCanvasParameterDataType;

  public constructor(data: {
    identifier: string;
    value: unknown;
    dataType: LiveCanvasParameterDataType;
  }) {
    this._identifier = data.identifier;
    this._value = data.value;
    this._dataType = data.dataType;
  }

  public get identifier(): string {
    return this._identifier;
  }

  public get value(): unknown {
    return this._value;
  }

  public get dataType(): LiveCanvasParameterDataType {
    return this._dataType;
  }
}
