import { IsObject } from 'class-validator';

export class BulkUpdateSettingsDto {
  @IsObject()
  settings: Record<string, string>;
}
