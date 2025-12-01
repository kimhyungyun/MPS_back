// src/signedurl/signed-url.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SignedUrlService {
  private readonly cloudfrontDomain = this.stripProtocol(process.env.CLOUDFRONT_DOMAIN!);
  private readonly cloudfrontUrl = `https://${this.cloudfrontDomain}`;
  private readonly keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;
  private readonly cookieDomain = process.env.CLOUDFRONT_COOKIE_DOMAIN!;
  private readonly ttlSec = Number(process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800);
  private readonly privateKey: string;

  constructor() {
    const keyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH || './cloudfront-private-key.pem';
    this.privateKey = fs.readFileSync(path.resolve(process.cwd(), keyPath), 'utf8');
  }

  private stripProtocol(domain: string) {
    return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  private cleanKey(str: string) {
    return String(str || '').replace(/^\/+/, '').replace(/\/+$/, '');
  }

  private cleanName(str: string) {
    return this.cleanKey(str).replace(/\.m3u8$/i, '');
  }

  // ✅ CloudFront Signed Cookie 정책 단일 Statement 버전
  private buildPolicy(folder: string, name: string, expiresAt: number) {
    const f = this.cleanKey(folder);
    const n = this.cleanName(name);

    // master + variants + ts 전체 포함하는 prefix
    const resourcePrefix = `https://${this.cloudfrontDomain}/${f}/${n}`;

    return JSON.stringify({
      Statement: [
        {
          Resource: `${resourcePrefix}*`,
          Condition: {
            DateLessThan: { 'AWS:EpochTime': expiresAt }
          },
        },
      ],
    });
  }

  async setCloudFrontSignedCookie(res: Response, folder: string, name: string) {
    const expiresAt = Math.floor(Date.now() / 1000) + this.ttlSec;
    const policy = this.buildPolicy(folder, name, expiresAt);

    const cookies = getSignedCookies({
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      policy,
    });

    const opt = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      domain: this.cookieDomain,
      path: '/',
      maxAge: this.ttlSec * 1000,
      encode: (v: string) => v,
    };

    res.cookie('CloudFront-Policy', cookies['CloudFront-Policy'], opt);
    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature'], opt);
    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id'], opt);
  }

  buildStreamUrl(folder: string, name: string) {
    return `${this.cloudfrontUrl}/${this.cleanKey(folder)}/${this.cleanName(name)}.m3u8`;
  }
}
