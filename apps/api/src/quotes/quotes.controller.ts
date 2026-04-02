import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, CreateQuoteItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] })
  findAll(@Query('status') status?: string) {
    return this.quotesService.findAll({ status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: CreateQuoteItemDto) {
    return this.quotesService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quotesService.removeItem(id, itemId);
  }
}
