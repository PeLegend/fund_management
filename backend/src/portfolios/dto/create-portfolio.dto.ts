import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @IsString()
  @IsNotEmpty()
  policy_code: string;
}
