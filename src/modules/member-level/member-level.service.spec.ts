jest.mock(
  '@common/dto/pagination.dto',
  () => ({
    buildPaginationMeta: jest.fn(),
    calcSkip: jest.fn((page: number, pageSize: number) => (page - 1) * pageSize),
    PaginationRequestDto: class {},
  }),
  { virtual: true },
);

jest.mock(
  '@common/messages/business.messages',
  () => ({
    BUSINESS_MESSAGES: {
      MEMBER_LEVEL: {
        NOT_FOUND: jest.fn((id: string) => `member-level:${id}`),
        NO_LEVEL: 'no-level',
        AVATAR_FRAME_NOT_ELIGIBLE: 'not-eligible',
        MEDAL_NOT_ELIGIBLE: 'medal-not-eligible',
      },
      USER: { NOT_FOUND: jest.fn((id: string) => `user:${id}`) },
    },
  }),
  { virtual: true },
);

jest.mock(
  '@modules/user/entities/user.entity',
  () => ({
    UserEntity: class {},
  }),
  { virtual: true },
);

jest.mock(
  '@modules/avatar-frame/entities/avatar-frame.entity',
  () => ({
    AvatarFrameEntity: class {},
  }),
  { virtual: true },
);

jest.mock(
  '@modules/medal/entities/medal.entity',
  () => ({
    MedalEntity: class {},
  }),
  { virtual: true },
);

jest.mock(
  '@modules/user-avatar-frame/user-avatar-frame.service',
  () => ({
    UserAvatarFrameService: class {
      checkOwnership = jest.fn();
      grantFrame = jest.fn();
    },
  }),
  { virtual: true },
);

jest.mock(
  '@modules/user-avatar-frame/enum/user-avatar-frame.enum',
  () => ({
    UserAvatarFrameMark: { LEVEL_REWARD: 'level reward' },
  }),
  { virtual: true },
);

jest.mock(
  '@modules/user-medal/user-medal.service',
  () => ({
    UserMedalService: class {
      checkOwnership = jest.fn();
      grantMedal = jest.fn();
    },
  }),
  { virtual: true },
);

jest.mock(
  '@modules/user-medal/enum/user-medal.enum',
  () => ({
    UserMedalMark: { LEVEL_REWARD: 'level reward' },
  }),
  { virtual: true },
);

import { getMetadataArgsStorage } from 'typeorm';
import { MemberLevelService } from './member-level.service';
import { MemberLevelEntity } from './entities/member-level.entity';
import { StorageConfigService } from '../storage/storage-config.service';

describe('MemberLevelService', () => {
  it('uses many-to-one avatarFrame relation so multiple member levels can share the same frame', () => {
    const relationMetadata = getMetadataArgsStorage().relations.find(
      (metadata) =>
        metadata.target === MemberLevelEntity && metadata.propertyName === 'avatarFrame',
    );

    expect(relationMetadata?.relationType).toBe('many-to-one');
  });

  it('maps avatarFrame relation into DTO with resolved URL', async () => {
    const storageConfig = {
      normalizeFileUrl: jest.fn((value: string | null | undefined) => value),
      resolveFileUrl: jest.fn(async (value: string | null | undefined) =>
        value ? `https://cdn.example.com/${value}` : null,
      ),
    } as unknown as StorageConfigService;

    const service = new MemberLevelService(
      {
        findOne: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        findAndCount: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      } as any,
      { findOne: jest.fn(), save: jest.fn(), increment: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      storageConfig,
      { checkOwnership: jest.fn() } as any,
      { checkOwnership: jest.fn() } as any,
    );

    const entity = {
      id: '1',
      name: '白银会员',
      level: 1,
      minSpending: 100,
      icon: 'icons/level.png',
      privileges: { goodsDiscount: 0.95, earlyTicket: true, fastRefund: false },
      avatarFrame: {
        id: 'frame-1',
        name: '金色框',
        url: 'frames/gold.png',
        cateory: { id: 'cate-1', name: '节日' },
        source: '活动获得',
        description: '节日限定',
        frameRatio: 1.2,
      },
      createdAt: new Date('2026-06-06T10:00:00.000Z'),
    } as MemberLevelEntity;

    const dto = await (service as any).toDto(entity);

    expect(dto.avatarFrame).toEqual({
      id: 'frame-1',
      name: '金色框',
      url: 'https://cdn.example.com/frames/gold.png',
      cateory: { id: 'cate-1', name: '节日' },
      source: '活动获得',
      description: '节日限定',
      frameRatio: 1.2,
    });
  });
});
