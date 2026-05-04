import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateItemQuantityDto {
  @ApiProperty({ example: 5, description: 'New quantity (0 removes the item)' })
  @IsInt()
  @Min(0)
  quantity: number;
}
