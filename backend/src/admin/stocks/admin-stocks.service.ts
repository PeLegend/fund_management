import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../../stocks/stock.entity';

@Injectable()
export class AdminStocksService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
  ) {}

  async findAll(): Promise<Stock[]> {
    return this.stockRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Stock> {
    const stock = await this.stockRepo.findOne({ where: { id } });
    if (!stock) throw new NotFoundException(`Stock ${id} not found`);
    return stock;
  }

  async create(stock_code: string, name: string): Promise<Stock> {
    if (!stock_code || !name) {
      throw new BadRequestException('Stock code and name are required');
    }
    const cleanCode = stock_code.trim().toUpperCase();
    const cleanName = name.trim();

    const existing = await this.stockRepo.findOne({ where: { stock_code: cleanCode } });
    if (existing) throw new ConflictException(`Stock code ${cleanCode} already exists`);

    const stock = this.stockRepo.create({ stock_code: cleanCode, name: cleanName });
    return this.stockRepo.save(stock);
  }

  async update(id: string, data: { stock_code?: string; name?: string }): Promise<Stock> {
    const stock = await this.findOne(id);
    if (data.stock_code) stock.stock_code = data.stock_code.trim().toUpperCase();
    if (data.name) stock.name = data.name.trim();
    return this.stockRepo.save(stock);
  }

  async remove(id: string): Promise<void> {
    const stock = await this.findOne(id);
    await this.stockRepo.remove(stock);
  }
}
