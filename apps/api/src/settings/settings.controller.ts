import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Post()
  bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings);
  }
}
