import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DiscountsModule } from '../src/discounts/discounts.module';

const createPctDiscount = (app: INestApplication, overrides = {}) =>
  request(app.getHttpServer())
    .post('/discounts')
    .send({
      name: '10% off Widget',
      type: 'PERCENTAGE_OFF_PRODUCT',
      config: { productId: 'p1', percentage: 10 },
      isActive: true,
      ...overrides,
    });

describe('Discounts (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DiscountsModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /discounts', () => {
    it('creates a discount and returns 201 with the resource', async () => {
      const res = await createPctDiscount(app);
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.type).toBe('PERCENTAGE_OFF_PRODUCT');
      expect(res.body.data.isActive).toBe(true);
      expect(res.body._links.self.href).toMatch(/\/discounts\//);
    });

    it('creates a BUY_X_GET_Y_FREE discount', async () => {
      const res = await request(app.getHttpServer())
        .post('/discounts')
        .send({
          name: 'Buy 2 get 1 free',
          type: 'BUY_X_GET_Y_FREE',
          config: { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 },
          isActive: true,
        });
      expect(res.status).toBe(201);
    });

    it('creates a CART_THRESHOLD_PERCENTAGE discount', async () => {
      const res = await request(app.getHttpServer())
        .post('/discounts')
        .send({
          name: '10% off over £100',
          type: 'CART_THRESHOLD_PERCENTAGE',
          config: { thresholdAmount: 100, percentage: 10 },
          isActive: true,
        });
      expect(res.status).toBe(201);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/discounts')
        .send({
          type: 'PERCENTAGE_OFF_PRODUCT',
          config: { productId: 'p1', percentage: 10 },
        });
      expect(res.status).toBe(400);
    });

    it('returns 400 for an unknown discount type', async () => {
      const res = await request(app.getHttpServer()).post('/discounts').send({
        name: 'Bad discount',
        type: 'UNKNOWN_TYPE',
        config: {},
        isActive: true,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /discounts', () => {
    it('returns 200 with empty array when no discounts exist', async () => {
      const res = await request(app.getHttpServer()).get('/discounts');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body._links.self.href).toBe('/discounts');
    });

    it('returns all created discounts', async () => {
      await createPctDiscount(app);
      await createPctDiscount(app, { name: 'Another discount' });
      const res = await request(app.getHttpServer()).get('/discounts');
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /discounts/:id', () => {
    it('returns the discount when found', async () => {
      const created = await createPctDiscount(app);
      const res = await request(app.getHttpServer()).get(`/discounts/${created.body.data.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.body.data.id);
    });

    it('returns 404 when the discount does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/discounts/unknown-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /discounts/:id', () => {
    it('updates the discount name and returns 200', async () => {
      const created = await createPctDiscount(app);
      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/discounts/${id}`)
        .send({ name: 'Updated name', isActive: false });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated name');
      expect(res.body.data.isActive).toBe(false);
    });

    it('returns 404 for an unknown discount', async () => {
      const res = await request(app.getHttpServer())
        .patch('/discounts/unknown-id')
        .send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /discounts/:id', () => {
    it('deletes the discount and returns 204', async () => {
      const created = await createPctDiscount(app);
      const id = created.body.data.id;
      const del = await request(app.getHttpServer()).delete(`/discounts/${id}`);
      expect(del.status).toBe(204);
      const get = await request(app.getHttpServer()).get(`/discounts/${id}`);
      expect(get.status).toBe(404);
    });
  });
});
