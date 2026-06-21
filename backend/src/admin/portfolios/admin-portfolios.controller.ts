import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminPortfoliosService } from './admin-portfolios.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/portfolios')
export class AdminPortfoliosController {
  constructor(private readonly portfoliosService: AdminPortfoliosService) {}

  @Get()
  findAll() {
    return this.portfoliosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portfoliosService.findOne(id);
  }
}
