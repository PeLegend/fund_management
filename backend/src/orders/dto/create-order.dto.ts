import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsIn } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  portfolio_code: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsIn(['BUY', 'SELL'])
  order_type?: 'BUY' | 'SELL';
}
