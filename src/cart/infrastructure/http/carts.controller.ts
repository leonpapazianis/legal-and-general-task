import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartService } from '../../application/cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item-quantity.dto';
import { HalResponse } from '../../../shared/infrastructure/hal/hal.types';
import { Cart, CartStatus } from '../../domain/cart.entity';

const toView = (cart: Cart) => ({
  id: cart.id,
  status: cart.status,
  items: cart.items,
  subtotal: cart.subtotal,
  createdAt: cart.createdAt,
  lastActivityAt: cart.lastActivityAt,
});

const toHal = (cart: Cart): HalResponse<ReturnType<typeof toView>> => {
  const links: Record<string, { href: string; method: string }> = {
    self: { href: `/carts/${cart.id}`, method: 'GET' },
  };
  if (cart.status === CartStatus.ACTIVE) {
    links.addItem = { href: `/carts/${cart.id}/items`, method: 'POST' };
    links.checkout = { href: `/carts/${cart.id}/checkout`, method: 'POST' };
  }
  return { data: toView(cart), _links: links };
};

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new shopping cart' })
  @ApiResponse({ status: 201, description: 'Cart created' })
  createCart() {
    return toHal(this.cartService.createCart());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cart by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Cart found' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  getCart(@Param('id') id: string) {
    return toHal(this.cartService.getCart(id));
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Item added' })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  @ApiResponse({ status: 409, description: 'Cart is not active' })
  @ApiResponse({ status: 422, description: 'Insufficient stock' })
  addItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return toHal(this.cartService.addItem(id, dto.productId, dto.quantity));
  }

  @Patch(':id/items/:productId')
  @ApiOperation({ summary: 'Update item quantity (0 removes the item)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Quantity updated' })
  @ApiResponse({ status: 404, description: 'Cart not found or product not in cart' })
  updateItemQuantity(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateItemQuantityDto,
  ) {
    return toHal(this.cartService.updateItemQuantity(id, productId, dto.quantity));
  }

  @Delete(':id/items/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 204, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'Cart not found or product not in cart' })
  removeItem(@Param('id') id: string, @Param('productId') productId: string) {
    this.cartService.removeItem(id, productId);
  }
}
