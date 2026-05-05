import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { Session } from '../auth/session.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('status') status: string | undefined,
    @Query('userId') userId: string | undefined,
    @Session('user') user: { id: string; role?: string },
  ) {
    const effectiveUserId = user.role === 'admin' ? userId : user.id;
    return this.ordersService.findAll({ status, userId: effectiveUserId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Session('user') user: { id: string; role?: string }) {
    const order = await this.ordersService.findOne(id);
    if (user.role !== 'admin') {
      if (!order.userId || order.userId !== user.id) {
        throw new ForbiddenException('You can only access your own orders');
      }
    }
    return order;
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Session('user') user: { id: string; role?: string }) {
    const payload = user.role === 'admin' ? dto : { ...dto, userId: user.id };
    return this.ordersService.create(payload);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
