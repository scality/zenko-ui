// Type declaration to make @hapi/joi compatible with @hookform/resolvers
// TODO: Remove this when @hapi/joi is updated to 18
declare module '@hookform/resolvers/joi' {
  import { FieldValues, Resolver } from 'react-hook-form';
  import * as Joi from '@hapi/joi';

  export function joiResolver<TFieldValues extends FieldValues = FieldValues>(
    schema: Joi.Schema,
    schemaOptions?: Joi.ValidationOptions,
    resolverOptions?: {
      mode?: 'async' | 'sync';
      rawValues?: boolean;
    }
  ): Resolver<TFieldValues, any>;
}

