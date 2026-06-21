import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminStocksService } from './admin-stocks.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/stocks')
export class AdminStocksController {
  constructor(private readonly stocksService: AdminStocksService) {}

  @Get()
  findAll() {
    return this.stocksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stocksService.findOne(id);
  }

  @Post()
  create(@Body() body: { stock_code: string; name: string }) {
    return this.stocksService.create(body.stock_code, body.name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { stock_code?: string; name?: string }) {
    return this.stocksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stocksService.remove(id);
  }
}
