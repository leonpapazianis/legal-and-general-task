import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from '../../application/products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { HalResponse } from '../../../shared/infrastructure/hal/hal.types';
import { Product } from '../../domain/product.entity';

const toView = (product: Product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  stock: product.stock,
  reserved: product.reserved,
  availableStock: product.availableStock,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const toHal = (product: Product): HalResponse<ReturnType<typeof toView>> => ({
  data: toView(product),
  _links: {
    self: { href: `/products/${product.id}`, method: 'GET' },
    update: { href: `/products/${product.id}`, method: 'PATCH' },
    delete: { href: `/products/${product.id}`, method: 'DELETE' },
  },
});

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateProductDto) {
    return toHal(this.productsService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'Product list' })
  findAll() {
    return {
      data: this.productsService.findAll(),
      _links: {
        self: { href: '/products', method: 'GET' },
        create: { href: '/products', method: 'POST' },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return toHal(this.productsService.findById(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 422, description: 'Invalid field value' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return toHal(this.productsService.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    this.productsService.delete(id);
  }
}
