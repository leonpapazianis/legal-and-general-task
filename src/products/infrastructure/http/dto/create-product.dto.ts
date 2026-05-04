import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Blue Widget', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A high-quality widget', description: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 9.99, description: 'Unit price (must be > 0)' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 100, description: 'Initial stock quantity (>= 0)' })
  @IsInt()
  @Min(0)
  stock: number;
}
