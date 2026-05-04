import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ example: 'uuid-of-product', description: 'Product ID to add' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity to add (>= 1)' })
  @IsInt()
  @Min(1)
  quantity: number;
}
