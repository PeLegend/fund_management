import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get(':customer_code')
  findByCode(@Param('customer_code') customer_code: string) {
    return this.customersService.findByCode(customer_code);
  }

  @Post()
  create(@Body() body: { customer_code: string; name: string }) {
    return this.customersService.create(body.customer_code, body.name);
  }
}
