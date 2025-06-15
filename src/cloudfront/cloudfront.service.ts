import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudfrontService {
  private readonly keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;
  private readonly privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH!;
  private readonly cloudfrontDomain = 'dmrf31aonqjrp.cloudfront.net'; // 하드코딩된 도메인
  private readonly privateKey: string;

  constructor() {
    try {
      this.privateKey = fs.readFileSync(path.resolve(this.privateKeyPath), 'utf8');
    } catch (error) {
      console.error('Error reading private key:', error);
      throw new Error('Failed to read CloudFront private key');
    }
  }

  async generateSignedUrl(filePath: string): Promise<string> {
    try {
      const fullUrl = `https://${this.cloudfrontDomain}/${filePath}`;
      const dateLessThan = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간

      return getSignedUrl({
        url: fullUrl,
        keyPairId: this.keyPairId,
        privateKey: this.privateKey,
        dateLessThan,
      });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }
} 