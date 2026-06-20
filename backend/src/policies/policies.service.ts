import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './policy.entity';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
  ) {}

  async findAll(): Promise<Policy[]> {
    return this.policyRepo.find({
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });
  }

  async findByCode(policy_code: string): Promise<Policy> {
    const policy = await this.policyRepo.findOne({
      where: { policy_code },
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${policy_code} not found`);
    }

    return policy;
  }
}
