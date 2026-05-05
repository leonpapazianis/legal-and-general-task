import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

const createProduct = (app: INestApplication, overrides = {}) =>
  request(app.getHttpServer())
    .post('/products')
    .send({ name: 'Widget', description: 'A test widget', price: 9.99, stock: 10, ...overrides });

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProductsModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /products', () => {
    it('creates a product and returns 201 with the resource', async () => {
      const res = await createProduct(app);
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Widget');
      expect(res.body.data.availableStock).toBe(10);
      expect(res.body._links.self.href).toMatch(/\/products\//);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer()).post('/products').send({ name: 'X' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when price is zero', async () => {
      const res = await createProduct(app, { price: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /products', () => {
    it('returns 200 with an empty array when no products exist', async () => {
      const res = await request(app.getHttpServer()).get('/products');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body._links.self.href).toBe('/products');
    });

    it('returns all created products', async () => {
      await createProduct(app);
      await createProduct(app, { name: 'Gadget' });
      const res = await request(app.getHttpServer()).get('/products');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /products/:id', () => {
    it('returns the product when found', async () => {
      const created = await createProduct(app);
      const res = await request(app.getHttpServer()).get(`/products/${created.body.data.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.body.data.id);
    });

    it('returns 404 when the product does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/products/unknown-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /products/:id', () => {
    it('updates the product and returns 200', async () => {
      const created = await createProduct(app);
      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/products/${id}`)
        .send({ name: 'Updated Widget', price: 14.99 });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Widget');
      expect(res.body.data.price).toBe(14.99);
    });

    it('returns 404 for an unknown product', async () => {
      const res = await request(app.getHttpServer())
        .patch('/products/unknown-id')
        .send({ name: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when price is set to zero', async () => {
      const created = await createProduct(app);
      const res = await request(app.getHttpServer())
        .patch(`/products/${created.body.data.id}`)
        .send({ price: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /products/:id', () => {
    it('deletes the product and returns 204', async () => {
      const created = await createProduct(app);
      const id = created.body.data.id;
      const del = await request(app.getHttpServer()).delete(`/products/${id}`);
      expect(del.status).toBe(204);
      const get = await request(app.getHttpServer()).get(`/products/${id}`);
      expect(get.status).toBe(404);
    });

    it('returns 404 for an unknown product', async () => {
      const res = await request(app.getHttpServer()).delete('/products/unknown-id');
      expect(res.status).toBe(404);
    });
  });
});
