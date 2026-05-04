import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DiscountsService } from '../../application/discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Discount } from '../../domain/discount.entity';
import { HalResponse } from '../../../shared/infrastructure/hal/hal.types';

const toHal = (discount: Discount): HalResponse<Discount> => ({
  data: discount,
  _links: {
    self: { href: `/discounts/${discount.id}`, method: 'GET' },
    update: { href: `/discounts/${discount.id}`, method: 'PATCH' },
    delete: { href: `/discounts/${discount.id}`, method: 'DELETE' },
  },
});

@ApiTags('discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a discount' })
  @ApiResponse({ status: 201, description: 'Discount created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateDiscountDto) {
    return toHal(this.discountsService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List all discounts' })
  @ApiResponse({ status: 200, description: 'Discount list' })
  findAll() {
    return {
      data: this.discountsService.findAll(),
      _links: {
        self: { href: '/discounts', method: 'GET' },
        create: { href: '/discounts', method: 'POST' },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Discount found' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  findOne(@Param('id') id: string) {
    return toHal(this.discountsService.findById(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a discount' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return toHal(this.discountsService.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Discount deleted' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  remove(@Param('id') id: string) {
    this.discountsService.delete(id);
  }
}
