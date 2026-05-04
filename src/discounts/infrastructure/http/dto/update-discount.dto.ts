import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDiscountDto {
  @ApiPropertyOptional({ example: 'Summer Sale' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
