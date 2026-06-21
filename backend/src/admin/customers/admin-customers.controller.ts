import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customersService: AdminCustomersService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.customersService.findAll(Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() body: { customer_code: string; name: string }) {
    return this.customersService.create(body.customer_code, body.name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string }) {
    return this.customersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
