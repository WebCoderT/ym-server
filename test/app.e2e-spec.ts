import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/configure-app';
import { AccessLevel } from './../src/access-level.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  const createToken = (role: AccessLevel) =>
    jwt.sign({ sub: `${role}-user`, role }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it('/public/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/public/health')
      .expect(200)
      .expect({ audience: 'public', status: 'ok' });
  });

  it('/admin/users rejects client role', () => {
    return request(app.getHttpServer())
      .get('/admin/users')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .expect(403);
  });

  it('/admin/users rejects missing role header', () => {
    return request(app.getHttpServer()).get('/admin/users').expect(403);
  });

  it('/client/profile accepts client role', () => {
    return request(app.getHttpServer())
      .get('/client/profile')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .expect(200)
      .expect({
        audience: 'client',
        profile: {
          id: 10001,
          nickname: 'demo-client',
        },
      });
  });

  it('/client/orders/:orderId/refund-preview accepts client role', () => {
    return request(app.getHttpServer())
      .get('/client/orders/9001001/refund-preview')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.audience).toBe('client');
        expect(response.body.orderId).toBe(9001001);
        expect(response.body.refundable).toBe(true);
        expect(response.body.ruleSnapshot.policyName).toContain('退票规则');
      });
  });

  it('/client/orders/:orderId/refund-applications creates refund request', () => {
    return request(app.getHttpServer())
      .post('/client/orders/9001001/refund-applications')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .send({
        reason: '临时无法参加活动，申请退票。',
        requestedAmount: 188,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.audience).toBe('client');
        expect(response.body.application.orderId).toBe(9001001);
        expect(response.body.application.applyAmount).toBe(188);
        expect(response.body.application.status).toBe('pending_review');
      });
  });

  it('/admin/refund-applications accepts admin role', () => {
    return request(app.getHttpServer())
      .get('/admin/refund-applications')
      .set('authorization', `Bearer ${createToken(AccessLevel.ADMIN)}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.audience).toBe('admin');
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].status).toBe('pending_review');
      });
  });

  it('/public/events/:eventId/refund-policy-summary returns public tiers', () => {
    return request(app.getHttpServer())
      .get('/public/events/7001001/refund-policy-summary')
      .expect(200)
      .expect((response) => {
        expect(response.body.audience).toBe('public');
        expect(response.body.eventId).toBe(7001001);
        expect(response.body.tiers).toHaveLength(3);
        expect(response.body.tiers[2].allowApply).toBe(false);
      });
  });

  it('shares admin refund policy updates with public summary and client preview', async () => {
    await request(app.getHttpServer())
      .put('/admin/events/7001001/refund-policy')
      .set('authorization', `Bearer ${createToken(AccessLevel.ADMIN)}`)
      .send({
        policyName: '深圳见面会退票规则 V4',
        autoApprove: false,
        tiers: [
          {
            stageName: 'T-96h 及以上',
            hoursBeforeStart: 96,
            refundRatio: 100,
            allowApply: true,
            description: '活动开始前 96 小时以上申请，支持全额退款。',
          },
          {
            stageName: 'T-48h 到 T-96h',
            hoursBeforeStart: 48,
            refundRatio: 60,
            allowApply: true,
            description: '活动开始前 48 到 96 小时申请，支持 60% 退款。',
          },
          {
            stageName: 'T-48h 内',
            hoursBeforeStart: 0,
            refundRatio: 0,
            allowApply: false,
            description: '活动开始前 48 小时内不支持退票。',
          },
        ],
      })
      .expect(200);

    const publicSummary = await request(app.getHttpServer())
      .get('/public/events/7001001/refund-policy-summary')
      .expect(200);

    expect(publicSummary.body.policyName).toBe('深圳见面会退票规则 V4');
    expect(publicSummary.body.tiers[1].refundRatio).toBe(60);

    const preview = await request(app.getHttpServer())
      .get('/client/orders/9001001/refund-preview')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .expect(200);

    expect(preview.body.ruleSnapshot.policyName).toBe('深圳见面会退票规则 V4');
    expect(preview.body.refundableAmount).toBe(299);
  });

  it('keeps client created refund application visible in admin review list', async () => {
    const created = await request(app.getHttpServer())
      .post('/client/orders/9001001/refund-applications')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .send({
        reason: '行程冲突，申请退款。',
        requestedAmount: 177,
      })
      .expect(201);

    const adminList = await request(app.getHttpServer())
      .get('/admin/refund-applications')
      .set('authorization', `Bearer ${createToken(AccessLevel.ADMIN)}`)
      .expect(200);

    const matched = adminList.body.items.find(
      (item: { refundId: number }) =>
        item.refundId === created.body.application.refundId,
    );

    expect(matched).toBeDefined();
    expect(matched.applyAmount).toBe(177);
    expect(matched.reason).toBe('行程冲突，申请退款。');
  });

  it('/docs/admin-json exposes only admin paths', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs/admin-json')
      .set('authorization', `Bearer ${createToken(AccessLevel.ADMIN)}`)
      .expect(200);

    expect(response.body.paths['/admin/users']).toBeDefined();
    expect(response.body.paths['/admin/refund-applications']).toBeDefined();
    expect(
      response.body.paths['/admin/events/{eventId}/refund-policy'],
    ).toBeDefined();
    expect(response.body.paths['/client/profile']).toBeUndefined();
    expect(response.body.paths['/public/health']).toBeUndefined();
  });

  it('/docs/client-json blocks admin docs mismatch', () => {
    return request(app.getHttpServer())
      .get('/docs/client-json')
      .set('authorization', `Bearer ${createToken(AccessLevel.ADMIN)}`)
      .expect(403);
  });

  it('/docs/public-json exposes only public paths', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs/public-json')
      .expect(200);

    expect(response.body.paths['/public/health']).toBeDefined();
    expect(
      response.body.paths['/public/events/{eventId}/refund-policy-summary'],
    ).toBeDefined();
    expect(response.body.paths['/admin/users']).toBeUndefined();
    expect(response.body.paths['/client/profile']).toBeUndefined();
  });

  it('/docs/client-json exposes refund client paths only to client docs', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs/client-json')
      .set('authorization', `Bearer ${createToken(AccessLevel.CLIENT)}`)
      .expect(200);

    expect(
      response.body.paths['/client/orders/{orderId}/refund-preview'],
    ).toBeDefined();
    expect(
      response.body.paths['/client/orders/{orderId}/refund-applications'],
    ).toBeDefined();
    expect(response.body.paths['/admin/refund-applications']).toBeUndefined();
  });
});
