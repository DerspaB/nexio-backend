import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login with invalid credentials should return 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrong' })
      .expect(401);
  });

  it('GET /api/users without token should return 401', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(401);
  });
});
