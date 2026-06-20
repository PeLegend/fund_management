import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['PROCESSING', 'COMPLETED', 'FAILED'])
  status: string;
}
