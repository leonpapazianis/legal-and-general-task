import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Red Widget' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'An updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 14.99 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
