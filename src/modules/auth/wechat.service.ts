/**
 * @fileoverview 微信服务
 * 封装微信开放平台的 API 调用，包括小程序登录 code2Session 等。
 * 使用 Node.js 内置的 https 模块发起请求，无需引入第三方 HTTP 客户端。
 * 配置从数据库的 payment_config 表读取。
 */

import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { get, request as httpsRequest } from 'node:https';
import { PaymentConfigService } from '../payment-config/payment-config.service';

/**
 * 微信 code2Session 接口的成功响应结构
 * 参考文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
 */
interface Code2SessionSuccessResponse {
  /** 用户唯一标识 openid */
  openid: string;
  /** 会话密钥 session_key */
  session_key: string;
  /** 微信开放平台 unionid（仅当满足 UnionID 下发条件时返回） */
  unionid?: string;
}

/**
 * 微信 code2Session 接口的错误响应结构
 */
interface Code2SessionErrorResponse {
  /** 错误码 */
  errcode: number;
  /** 错误信息 */
  errmsg: string;
}

/** 微信 API 响应可能是成功或错误响应 */
type Code2SessionResponse = Code2SessionSuccessResponse | Code2SessionErrorResponse;

/** access_token 内存缓存 */
let accessTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * 微信服务
 * 提供微信小程序相关的 API 调用能力，包括 code2Session 登录和获取用户手机号
 */
@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(private readonly paymentConfigService: PaymentConfigService) {}

  /**
   * 判断微信凭证是否已配置
   */
  async isConfigured(): Promise<boolean> {
    const appId = await this.paymentConfigService.getWechatAppId();
    const appSecret = await this.paymentConfigService.getWechatAppSecret();
    return Boolean(appId && appSecret);
  }

  /**
   * 调用微信 code2Session 接口
   * 使用微信登录临时 code 换取用户 openid 和会话密钥 session_key
   *
   * @param code - 微信小程序 wx.login() 获取的临时登录凭证
   * @returns 包含 openid 和 session_key 的响应对象
   * @throws ForbiddenException 当微信凭证未配置或 API 调用失败时抛出
   */
  async code2Session(code: string): Promise<Code2SessionResponse> {
    const appId = await this.paymentConfigService.getWechatAppId();
    const appSecret = await this.paymentConfigService.getWechatAppSecret();

    // 构建请求 URL
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    this.logger.debug(`调用微信 code2Session，appId=${appId.slice(0, 6)}...`);

    return new Promise((resolve, reject) => {
      get(url.toString(), (res) => {
        let body = '';

        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(body) as Code2SessionResponse;
            const logData = 'openid' in data
              ? { openid: data.openid, session_key: data.session_key ? '***' : undefined }
              : { errcode: data.errcode, errmsg: data.errmsg };
            this.logger.debug(`微信 code2Session 响应：${JSON.stringify(logData)}`);

            // 检查是否包含错误码
            if ('errcode' in data && data.errcode !== 0) {
              this.logger.warn(`微信 code2Session 失败：errcode=${data.errcode}, errmsg=${data.errmsg}`);
              reject(this.buildWechatError(data.errcode, data.errmsg));
              return;
            }

            resolve(data);
          } catch (parseError) {
            this.logger.error(`微信 code2Session 响应解析失败：${body}`);
            reject(new ForbiddenException('微信接口响应解析失败'));
          }
        });
      }).on('error', (err) => {
        this.logger.error(`微信 code2Session 网络请求失败：${err.message}`);
        reject(new ForbiddenException('微信接口请求失败，请稍后重试'));
      });
    });
  }

  /**
   * 根据微信错误码构建友好的错误提示
   *
   * @param errcode - 微信 API 错误码
   * @param errmsg - 微信 API 错误信息
   * @returns 格式化的异常对象
   */
  private buildWechatError(errcode: number, errmsg: string): ForbiddenException {
    switch (errcode) {
      case 40029:
        return new ForbiddenException('微信登录码已失效，请重新登录');
      case 40226:
        return new ForbiddenException('高风险用户，登录被拦截');
      case 45011:
        return new ForbiddenException('登录请求过于频繁，请稍后重试');
      case 40163:
        return new ForbiddenException('微信登录码已被使用，请重新登录');
      default:
        return new ForbiddenException(`微信登录失败（${errcode}），请稍后重试`);
    }
  }

  /**
   * 使用 code 换取微信 openid
   * 如果微信凭证已配置，调用真实 API；否则在开发环境下降级为模拟模式
   *
   * @param code - 微信登录临时码
   * @returns 用户 openid 字符串
   * @throws ForbiddenException 当 code 为空或登录失败时抛出
   */
  async resolveOpenId(code: string): Promise<string> {
    const normalized = code.trim();

    if (!normalized) {
      throw new ForbiddenException('微信登录 code 不能为空');
    }

    // 微信凭证已配置：调用真实 code2Session 接口
    if (await this.isConfigured()) {
      const response = await this.code2Session(normalized);

      if ('openid' in response && response.openid) {
        this.logger.log(`微信登录成功，openid=${response.openid.slice(0, 8)}...`);
        return response.openid;
      }

      throw new ForbiddenException('微信登录失败：未获取到 openid');
    }

    // 开发环境降级：凭证未配置时生成模拟 openid
    this.logger.warn(
      '微信凭证未配置，使用模拟 openid。' +
      '请在管理后台配置微信 AppID 和 AppSecret！',
    );
    return `wx_${Buffer.from(normalized).toString('hex').slice(0, 20)}`;
  }

  /* ───────────────────── 获取用户手机号 ───────────────────── */

  /**
   * 获取接口调用凭据 access_token（带内存缓存）
   *
   * @returns 有效的 access_token 字符串
   * @throws ForbiddenException 当微信凭证未配置或获取失败时抛出
   */
  async getAccessToken(): Promise<string> {
    // 缓存有效则直接返回（提前 5 分钟刷新，避免临界过期）
    if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 300_000) {
      return accessTokenCache.token;
    }

    const appId = await this.paymentConfigService.getWechatAppId();
    const appSecret = await this.paymentConfigService.getWechatAppSecret();

    if (!appId || !appSecret) {
      throw new ForbiddenException('微信凭证未配置，无法获取手机号');
    }

    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);

    this.logger.debug('请求微信 access_token...');

    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      get(url.toString(), (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new ForbiddenException('微信 access_token 响应解析失败'));
          }
        });
      }).on('error', (err) => {
        this.logger.error(`获取 access_token 网络请求失败：${err.message}`);
        reject(new ForbiddenException('获取微信 access_token 失败，请稍后重试'));
      });
    });

    if (data.errcode) {
      this.logger.warn(`获取 access_token 失败：errcode=${data.errcode}, errmsg=${data.errmsg}`);
      throw new ForbiddenException(`获取微信 access_token 失败（${data.errcode}）`);
    }

    const token = data.access_token as string;
    const expiresIn = (data.expires_in as number) || 7200;

    // 写入缓存
    accessTokenCache = {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    this.logger.log(`微信 access_token 获取成功，有效期 ${expiresIn}s`);
    return token;
  }

  /**
   * 通过微信 getPhoneNumber 接口获取用户手机号
   *
   * @description
   * 客户端使用 `<button open-type="getPhoneNumber">` 获取临时 code，
   * 服务端用此 code + access_token 调用微信 API 获取手机号。
   *
   * @param code - 客户端 getPhoneNumber 事件回调中的 code
   * @returns 用户手机号（纯数字字符串，如 "13800138000"）
   * @throws ForbiddenException 当获取失败时抛出
   */
  async getPhoneNumber(code: string): Promise<string> {
    const trimmed = code.trim();
    if (!trimmed) {
      throw new ForbiddenException('微信手机号 code 不能为空');
    }

    const accessToken = await this.getAccessToken();

    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

    this.logger.debug('调用微信 getPhoneNumber...');

    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const requestBody = JSON.stringify({ code: trimmed });

      const req = httpsRequest(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          res.on('end', () => {
            this.logger.debug(`微信 getPhoneNumber 响应：${body.slice(0, 200)}`);
            try {
              resolve(JSON.parse(body));
            } catch {
              this.logger.error(`微信 getPhoneNumber 响应非 JSON：${body.slice(0, 500)}`);
              reject(new ForbiddenException('微信 getPhoneNumber 响应解析失败'));
            }
          });
        },
      );

      req.on('error', (err) => {
        this.logger.error(`getPhoneNumber 网络请求失败：${err.message}`);
        reject(new ForbiddenException('获取微信手机号失败，请稍后重试'));
      });

      req.write(requestBody);
      req.end();
    });

    // 检查 errcode
    const errcode = data.errcode as number;
    if (errcode !== 0) {
      this.logger.warn(`微信 getPhoneNumber 失败：errcode=${errcode}, errmsg=${data.errmsg}`);

      // access_token 过期时清除缓存，下次重试
      if (errcode === 40001 || errcode === 42001) {
        accessTokenCache = null;
      }

      throw new ForbiddenException(`获取微信手机号失败（${errcode}），请稍后重试`);
    }

    // 提取手机号
    const phoneInfo = data.phone_info as { phoneNumber?: string } | undefined;
    const phoneNumber = phoneInfo?.phoneNumber;

    if (!phoneNumber) {
      throw new ForbiddenException('微信未返回手机号，请重试');
    }

    this.logger.log(`微信手机号获取成功：${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`);
    return phoneNumber;
  }
}
