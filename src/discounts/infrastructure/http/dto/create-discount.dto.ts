import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../domain/discount.entity';

class PercentageOffProductConfigDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  percentage: number;
}

class FixedAmountOffProductConfigDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsPositive()
  amountOff: number;
}

class BuyXGetYFreeConfigDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  buyQuantity: number;
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  getFreeQuantity: number;
}

class CartThresholdPercentageConfigDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  thresholdAmount: number;
  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  percentage: number;
}

export class CreateDiscountDto {
  @ApiProperty({ example: '10% off Widget' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Config shape depends on type' })
  @IsObject()
  config:
    | PercentageOffProductConfigDto
    | FixedAmountOffProductConfigDto
    | BuyXGetYFreeConfigDto
    | CartThresholdPercentageConfigDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
