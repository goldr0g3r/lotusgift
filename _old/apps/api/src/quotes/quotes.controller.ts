import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { Session } from '../auth/session.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] })
  findAll(
    @Query('status') status: string | undefined,
    @Session('user') user: { id: string; role?: string },
  ) {
    const userId = user.role === 'admin' ? undefined : user.id;
    return this.quotesService.findAll({ status, userId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Session('user') user: { id: string; role?: string }) {
    const quote = await this.quotesService.findOne(id);
    if (user.role !== 'admin') {
      if (!quote.userId || quote.userId !== user.id) {
        throw new ForbiddenException('You can only access your own quotes');
      }
    }
    return quote;
  }

  @Post()
  create(@Body() dto: CreateQuoteDto, @Session('user') user: { id: string; role?: string }) {
    const payload = user.role === 'admin' ? dto : { ...dto, userId: user.id };
    return this.quotesService.create(payload);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }

  @Roles('admin')
  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: CreateQuoteItemDto) {
    return this.quotesService.addItem(id, dto);
  }

  @Roles('admin')
  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quotesService.removeItem(id, itemId);
  }
}
