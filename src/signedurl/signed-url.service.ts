// src/signed-url/signed-url.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SignedUrlService {
  private readonly cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}`;
  private readonly keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;
  private readonly cookieDomain = process.env.CLOUDFRONT_COOKIE_DOMAIN!;
  private readonly ttlSec = Number(process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800);
  private readonly privateKey: string;

  constructor() {
    const keyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH || './cloudfront-private-key.pem';
    this.privateKey = fs.readFileSync(path.resolve(process.cwd(), keyPath), 'utf8');
  }

  private clean(str: string) {
    return str.replace(/\/$/, "");
  }

  /**
   * CloudFront Signed Cookie 발급
   */
  async setCloudFrontSignedCookie(
    res: Response,
    folder: string,
    name: string
  ) {
    const cleanFolder = this.clean(folder);
    const cleanName = this.clean(name);

    const expiresAt = Math.floor(Date.now() / 1000) + this.ttlSec;

    // ✅ *.ts, *.m3u8 모두 허용
    const resourcePattern = `${this.cloudfrontUrl}/${cleanFolder}/*`;

    const policy = JSON.stringify({
      Statement: [
        {
          Resource: resourcePattern,
          Condition: { DateLessThan: { "AWS:EpochTime": expiresAt } }
        }
      ]
    });

    const cookies = getSignedCookies({
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      policy,
    });

    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      domain: this.cookieDomain,
      path: "/",
      maxAge: this.ttlSec * 1000
    };

    res.cookie("CloudFront-Policy", cookies["CloudFront-Policy"], cookieOption);
    res.cookie("CloudFront-Signature", cookies["CloudFront-Signature"], cookieOption);
    res.cookie("CloudFront-Key-Pair-Id", cookies["CloudFront-Key-Pair-Id"], cookieOption);
  }

  /**
   * ✅ m3u8 URL 생성
   */
  buildStreamUrl(folder: string, name: string) {
    const cleanFolder = this.clean(folder);
    const cleanName = this.clean(name);
    return `${this.cloudfrontUrl}/${cleanFolder}/${cleanName}.m3u8`;
  }
}
