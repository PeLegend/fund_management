import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findByPortfolio(@Query('portfolio_code') portfolio_code: string) {
    return this.ordersService.findByPortfolio(portfolio_code);
  }

  @Get(':order_code')
  findByCode(@Param('order_code') order_code: string) {
    return this.ordersService.findByCode(order_code);
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':order_code/cancel')
  cancel(@Param('order_code') order_code: string) {
    return this.ordersService.cancel(order_code);
  }

  @Patch(':order_code/status')
  updateStatus(
    @Param('order_code') order_code: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(order_code, dto);
  }
}
