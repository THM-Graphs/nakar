import type { ValidatorOptions } from 'class-validator';

export const validatorOptions: ValidatorOptions = {
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  stopAtFirstError: true,
  whitelist: true,
};
