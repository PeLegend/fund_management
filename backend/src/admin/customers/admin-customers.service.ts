import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customers/customer.entity';

@Injectable()
export class AdminCustomersService {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [items, total] = await this.customerRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async create(customer_code: string, name: string): Promise<Customer> {
    if (!customer_code || !name) {
      throw new BadRequestException('Customer code and name are required');
    }
    const cleanCode = customer_code.trim().toUpperCase();
    const cleanName = name.trim();

    const existing = await this.customerRepo.findOne({ where: { customer_code: cleanCode } });
    if (existing) throw new ConflictException(`Customer code ${cleanCode} already exists`);

    const customer = this.customerRepo.create({ customer_code: cleanCode, name: cleanName });
    return this.customerRepo.save(customer);
  }

  async update(id: string, data: { name?: string }): Promise<Customer> {
    const customer = await this.findOne(id);
    if (data.name) customer.name = data.name.trim();
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepo.remove(customer);
  }
}
