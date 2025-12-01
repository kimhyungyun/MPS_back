import { Injectable, Logger } from '@nestjs/common';

interface SendSmsOptions {
  to: string;
  content: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send({ to, content }: SendSmsOptions): Promise<void> {
    // TODO: 실제 SMS 발송 API 연동 (토스트, 누리고, 알리고 등)
    this.logger.log(`📨 SMS send => to: ${to}, content: ${content}`);
    // 예: await this.smsClient.send({ to, content });
  }
}
