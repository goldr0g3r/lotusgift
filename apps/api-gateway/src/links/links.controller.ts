import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import type { CreateLinkDto, UpdateLinkDto } from '@repo/api';
import { AllowAnonymous } from '@lotusgift/auth-service';

import { LinksService } from './links.service.js';

// Demo CRUD scaffold from the NestJS CLI generator. Anonymous-allowed
// until a real authz model lands at P6 (per-controller @Session() guard
// + RBAC). Kept here as the integration smoke test for `@repo/api` Kubb
// hooks.
@AllowAnonymous()
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.create(createLinkDto);
  }

  @Get()
  findAll() {
    return this.linksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.linksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLinkDto: UpdateLinkDto) {
    return this.linksService.update(+id, updateLinkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.linksService.remove(+id);
  }
}
