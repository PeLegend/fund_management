import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminPoliciesService } from './admin-policies.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/policies')
export class AdminPoliciesController {
  constructor(private readonly policiesService: AdminPoliciesService) {}

  @Get()
  findAll() {
    return this.policiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Post()
  create(@Body() body: { policy_code: string; name: string; policy_stocks: { stock_id: string; weight: number }[] }) {
    return this.policiesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; policy_stocks?: { stock_id: string; weight: number }[] }) {
    return this.policiesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}
