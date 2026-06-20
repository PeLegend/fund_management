import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  findByCustomer(@Query('customer_code') customer_code: string) {
    return this.portfoliosService.findByCustomer(customer_code);
  }

  @Get(':portfolio_code')
  findByCode(@Param('portfolio_code') portfolio_code: string) {
    return this.portfoliosService.findByCode(portfolio_code);
  }

  @Post()
  create(@Body() dto: CreatePortfolioDto) {
    return this.portfoliosService.create(dto);
  }
}
