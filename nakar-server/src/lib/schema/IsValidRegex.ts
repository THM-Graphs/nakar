import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidRegex', async: false })
export class IsValidRegex implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      new RegExp(value);
      return true;
    } catch {
      return false;
    }
  }

  public defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid regex.`;
  }
}
