import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CartModule } from '../src/cart/cart.module';
import { ProductsModule } from '../src/products/products.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

const createProduct = (app: INestApplication, overrides = {}) =>
  request(app.getHttpServer())
    .post('/products')
    .send({ name: 'Widget', description: '', price: 9.99, stock: 10, ...overrides });

const createCart = (app: INestApplication) => request(app.getHttpServer()).post('/carts').send();

describe('Carts (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CartModule, ProductsModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /carts', () => {
    it('creates an ACTIVE cart and returns 201 with HAL links', async () => {
      const res = await createCart(app);
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body._links.self.href).toMatch(/\/carts\//);
      expect(res.body._links.addItem).toBeDefined();
    });
  });

  describe('GET /carts/:id', () => {
    it('returns the cart by id', async () => {
      const created = await createCart(app);
      const id = created.body.data.id;
      const res = await request(app.getHttpServer()).get(`/carts/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
    });

    it('returns 404 for an unknown cart id', async () => {
      const res = await request(app.getHttpServer()).get('/carts/unknown-id');
      expect(res.status).toBe(404);
    });

    it('ACTIVE cart includes addItem and checkout links', async () => {
      const created = await createCart(app);
      const res = await request(app.getHttpServer()).get(`/carts/${created.body.data.id}`);
      expect(res.body._links.addItem).toBeDefined();
      expect(res.body._links.checkout).toBeDefined();
    });
  });

  describe('POST /carts/:id/items', () => {
    it('adds an item and reserves stock, returns 201', async () => {
      const product = await createProduct(app);
      const productId = product.body.data.id;
      const cart = await createCart(app);
      const cartId = cart.body.data.id;

      const res = await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 3 });

      expect(res.status).toBe(201);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(3);

      const productRes = await request(app.getHttpServer()).get(`/products/${productId}`);
      expect(productRes.body.data.availableStock).toBe(7);
    });

    it('merges quantity when the same product is added twice', async () => {
      const product = await createProduct(app);
      const productId = product.body.data.id;
      const cart = await createCart(app);
      const cartId = cart.body.data.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 2 });
      const res = await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 3 });

      expect(res.status).toBe(201);
      expect(res.body.data.items[0].quantity).toBe(5);
    });

    it('returns 422 when stock is insufficient', async () => {
      const product = await createProduct(app, { stock: 2 });
      const cart = await createCart(app);

      const res = await request(app.getHttpServer())
        .post(`/carts/${cart.body.data.id}/items`)
        .send({ productId: product.body.data.id, quantity: 5 });

      expect(res.status).toBe(422);
    });

    it('returns 404 when cart does not exist', async () => {
      const product = await createProduct(app);
      const res = await request(app.getHttpServer())
        .post('/carts/unknown-id/items')
        .send({ productId: product.body.data.id, quantity: 1 });
      expect(res.status).toBe(404);
    });

    it('returns 400 when quantity is missing', async () => {
      const cart = await createCart(app);
      const res = await request(app.getHttpServer())
        .post(`/carts/${cart.body.data.id}/items`)
        .send({ productId: 'p1' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when cart is already checked out', async () => {
      const product = await createProduct(app);
      const cart = await createCart(app);
      const cartId = cart.body.data.id;
      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId: product.body.data.id, quantity: 1 });
      await request(app.getHttpServer()).post(`/carts/${cartId}/checkout`).send();

      const res = await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId: product.body.data.id, quantity: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('CartNotActiveError');
    });

    it('returns 422 when updating quantity exceeds available stock', async () => {
      const product = await createProduct(app, { stock: 3 });
      const cart = await createCart(app);
      const cartId = cart.body.data.id;
      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId: product.body.data.id, quantity: 2 });

      const res = await request(app.getHttpServer())
        .patch(`/carts/${cartId}/items/${product.body.data.id}`)
        .send({ quantity: 10 });
      expect(res.status).toBe(422);
      expect(res.body.error).toBe('StockUnavailableError');
    });
  });

  describe('PATCH /carts/:id/items/:productId', () => {
    it('updates the quantity and adjusts reservation, returns 200', async () => {
      const product = await createProduct(app);
      const productId = product.body.data.id;
      const cart = await createCart(app);
      const cartId = cart.body.data.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 2 });

      const res = await request(app.getHttpServer())
        .patch(`/carts/${cartId}/items/${productId}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(5);

      const productRes = await request(app.getHttpServer()).get(`/products/${productId}`);
      expect(productRes.body.data.availableStock).toBe(5);
    });

    it('removes item when quantity is set to 0', async () => {
      const product = await createProduct(app);
      const productId = product.body.data.id;
      const cart = await createCart(app);
      const cartId = cart.body.data.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 3 });
      const res = await request(app.getHttpServer())
        .patch(`/carts/${cartId}/items/${productId}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('returns 404 when product is not in cart', async () => {
      const cart = await createCart(app);
      const res = await request(app.getHttpServer())
        .patch(`/carts/${cart.body.data.id}/items/unknown-product`)
        .send({ quantity: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /carts/:id/items/:productId', () => {
    it('removes the item and releases reservation, returns 204', async () => {
      const product = await createProduct(app);
      const productId = product.body.data.id;
      const cart = await createCart(app);
      const cartId = cart.body.data.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({ productId, quantity: 4 });
      const res = await request(app.getHttpServer()).delete(`/carts/${cartId}/items/${productId}`);

      expect(res.status).toBe(204);

      const cartRes = await request(app.getHttpServer()).get(`/carts/${cartId}`);
      expect(cartRes.body.data.items).toHaveLength(0);

      const productRes = await request(app.getHttpServer()).get(`/products/${productId}`);
      expect(productRes.body.data.availableStock).toBe(10);
    });

    it('returns 404 when product is not in cart', async () => {
      const cart = await createCart(app);
      const res = await request(app.getHttpServer()).delete(
        `/carts/${cart.body.data.id}/items/unknown-product`,
      );
      expect(res.status).toBe(404);
    });
  });
});
