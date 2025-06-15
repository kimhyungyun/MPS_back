import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SignedUrlService {
  private readonly keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;
  private readonly privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH!;
  private readonly privateKey: string;

  constructor() {
    this.privateKey = fs.readFileSync(
      path.resolve(this.privateKeyPath),
      'utf8',
    );
  }

  generateSignedUrl(filePath: string, expiresInSeconds = 3600): string {
    const url = `https://dmrf31aonqjrp.cloudfront.net${filePath}`; // 예: /videos/1.m3u8
    const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    
    return getSignedUrl({
      url,
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      dateLessThan,
    });
  }
} 