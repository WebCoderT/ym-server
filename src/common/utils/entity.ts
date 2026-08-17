import { NotFoundException } from '@nestjs/common';
import type { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';

/**
 * 查找实体，不存在时抛出 NotFoundException
 *
 * 替代重复的 findOne + if (!entity) throw 模式：
 *
 * @example
 * ```ts
 * // Before (3 lines)
 * const star = await this.starRepo.findOne({ where: { id } });
 * if (!star) throw new NotFoundException('明星不存在');
 *
 * // After (1 line)
 * const star = await findOrThrow(this.starRepo, { id }, '明星不存在');
 * ```
 */
export async function findOrThrow<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  notFoundMsg: string,
): Promise<T> {
  const entity = await repo.findOne({ where });
  if (!entity) throw new NotFoundException(notFoundMsg);
  return entity;
}
