import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  portfolio_code: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
