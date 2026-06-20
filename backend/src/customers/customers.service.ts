import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async findByCode(customer_code: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { customer_code: customer_code.toUpperCase() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer code ${customer_code} not found`);
    }

    return customer;
  }

  async create(customer_code: string, name: string): Promise<Customer> {
    if (!customer_code || !name) {
      throw new BadRequestException('Customer code and name are required');
    }

    const cleanCode = customer_code.trim().toUpperCase();
    const cleanName = name.trim();

    if (cleanCode.length === 0 || cleanName.length === 0) {
      throw new BadRequestException('Customer code and name cannot be empty');
    }

    // Check for duplicate customer code
    const existing = await this.customerRepo.findOne({
      where: { customer_code: cleanCode },
    });

    if (existing) {
      throw new ConflictException(`Customer code ${cleanCode} is already registered`);
    }

    const customer = this.customerRepo.create({
      customer_code: cleanCode,
      name: cleanName,
    });

    return this.customerRepo.save(customer);
  }
}
