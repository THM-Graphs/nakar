import { validatorOptions } from './validatorOptions';
import type { ValidationPipeOptions } from '@nestjs/common';
import { transformOptions } from './transformOptions';

export const validationPipelineOptions: ValidationPipeOptions = {
  transform: true,
  disableErrorMessages: false,
  transformOptions: transformOptions,
  ...validatorOptions,
};
