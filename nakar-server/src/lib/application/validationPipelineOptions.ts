import { validatorOptions } from './validatorOptions';
import { ValidationPipeOptions } from '@nestjs/common';

export const validationPipelineOptions: ValidationPipeOptions = {
  transform: true,
  disableErrorMessages: false,
  ...validatorOptions,
};
