import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../../policies/policy.entity';
import { PolicyStock } from '../../policies/policy-stock.entity';

@Injectable()
export class AdminPoliciesService {
  constructor(
    @InjectRepository(Policy) private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyStock) private readonly policyStockRepo: Repository<PolicyStock>,
  ) {}

  async findAll(): Promise<Policy[]> {
    return this.policyRepo.find({
      relations: ['policy_stocks', 'policy_stocks.stock'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policyRepo.findOne({
      where: { id },
      relations: ['policy_stocks', 'policy_stocks.stock'],
    });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }

  async create(data: { policy_code: string; name: string; policy_stocks: { stock_id: string; weight: number }[] }): Promise<Policy> {
    if (!data.policy_code || !data.name) {
      throw new BadRequestException('Policy code and name are required');
    }
    const cleanCode = data.policy_code.trim().toUpperCase();

    const existing = await this.policyRepo.findOne({ where: { policy_code: cleanCode } });
    if (existing) throw new ConflictException(`Policy code ${cleanCode} already exists`);

    const policy = this.policyRepo.create({ policy_code: cleanCode, name: data.name.trim() });
    const savedPolicy = await this.policyRepo.save(policy);

    if (data.policy_stocks?.length) {
      const policyStocks = data.policy_stocks.map((ps) => ({
        policy_id: savedPolicy.id,
        stock_id: ps.stock_id,
        weight: ps.weight,
      }));
      await this.policyStockRepo.save(policyStocks);
    }

    return this.findOne(savedPolicy.id);
  }

  async update(id: string, data: { name?: string; policy_stocks?: { stock_id: string; weight: number }[] }): Promise<Policy> {
    const policy = await this.findOne(id);
    if (data.name) policy.name = data.name.trim();
    await this.policyRepo.save(policy);

    if (data.policy_stocks) {
      // Remove existing policy_stocks and replace
      await this.policyStockRepo.delete({ policy_id: id });
      if (data.policy_stocks.length) {
        const policyStocks = data.policy_stocks.map((ps) => ({
          policy_id: id,
          stock_id: ps.stock_id,
          weight: ps.weight,
        }));
        await this.policyStockRepo.save(policyStocks);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id);
    await this.policyStockRepo.delete({ policy_id: id });
    await this.policyRepo.remove(policy);
  }
}
