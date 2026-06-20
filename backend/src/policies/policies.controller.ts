import { Controller, Get, Param } from '@nestjs/common';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll() {
    return this.policiesService.findAll();
  }

  @Get(':policy_code')
  findByCode(@Param('policy_code') policy_code: string) {
    return this.policiesService.findByCode(policy_code);
  }
}
