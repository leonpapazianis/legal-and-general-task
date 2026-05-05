import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CartModule } from '../src/cart/cart.module';
import { ProductsModule } from '../src/products/products.module';
import { DiscountsModule } from '../src/discounts/discounts.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

const createProduct = (app: INestApplication, overrides = {}) =>
  request(app.getHttpServer())
    .post('/products')
    .send({ name: 'Widget', description: '', price: 10, stock: 10, ...overrides });

const createCart = (app: INestApplication) => request(app.getHttpServer()).post('/carts').send();

const addItem = (app: INestApplication, cartId: string, productId: string, quantity: number) =>
  request(app.getHttpServer()).post(`/carts/${cartId}/items`).send({ productId, quantity });

const checkout = (app: INestApplication, cartId: string) =>
  request(app.getHttpServer()).post(`/carts/${cartId}/checkout`).send();

describe('Checkout (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CartModule, ProductsModule, DiscountsModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(() => app.close());

  it('checks out an ACTIVE cart, commits stock, and returns 200 with totals', async () => {
    const product = await createProduct(app);
    const productId = product.body.data.id;
    const cart = await createCart(app);
    const cartId = cart.body.data.id;

    await addItem(app, cartId, productId, 3);

    const res = await checkout(app, cartId);

    expect(res.status).toBe(200);
    expect(res.body.data.cartId).toBe(cartId);
    expect(res.body.data.subtotal).toBe(30);
    expect(res.body.data.total).toBe(30);
    expect(res.body._links.self.href).toMatch(/\/carts\//);

    const cartRes = await request(app.getHttpServer()).get(`/carts/${cartId}`);
    expect(cartRes.body.data.status).toBe('CHECKED_OUT');

    const productRes = await request(app.getHttpServer()).get(`/products/${productId}`);
    expect(productRes.body.data.stock).toBe(7);
    expect(productRes.body.data.reserved).toBe(0);
  });

  it('applies active discounts and returns reduced total', async () => {
    const product = await createProduct(app);
    const productId = product.body.data.id;

    await request(app.getHttpServer())
      .post('/discounts')
      .send({
        name: '10% off Widget',
        type: 'PERCENTAGE_OFF_PRODUCT',
        config: { productId, percentage: 10 },
        isActive: true,
      });

    const cart = await createCart(app);
    await addItem(app, cart.body.data.id, productId, 2);

    const res = await checkout(app, cart.body.data.id);

    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(20);
    expect(res.body.data.total).toBe(18);
  });

  it('returns 409 when cart is already CHECKED_OUT', async () => {
    const product = await createProduct(app);
    const cart = await createCart(app);
    await addItem(app, cart.body.data.id, product.body.data.id, 1);
    await checkout(app, cart.body.data.id);

    const res = await checkout(app, cart.body.data.id);
    expect(res.status).toBe(409);
  });

  it('returns 422 when cart is empty', async () => {
    const cart = await createCart(app);
    const res = await checkout(app, cart.body.data.id);
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('InvariantViolationError');
  });

  it('returns 404 for unknown cart', async () => {
    const res = await checkout(app, 'unknown-id');
    expect(res.status).toBe(404);
  });
});
