import { Injectable, Logger } from '@nestjs/common';
import { SolapiMessageService } from 'solapi';

interface SendSmsOptions {
  to: string;      // 수신 번호 (01012345678 형식)
  content: string; // 문자 내용
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly messageService: SolapiMessageService | null;

  private readonly apiKey = process.env.COOLSMS_API_KEY;
  private readonly apiSecret = process.env.COOLSMS_API_SECRET;
  private readonly senderNumber = process.env.COOLSMS_SENDER_NUMBER; // 발신번호 (숫자만)

  constructor() {
    if (!this.apiKey || !this.apiSecret) {
      this.logger.error(
        'CoolSMS API Key/Secret 이 설정되어 있지 않습니다. (.env의 COOLSMS_API_KEY / COOLSMS_API_SECRET 확인)',
      );
      this.messageService = null;
    } else {
      this.messageService = new SolapiMessageService(
        this.apiKey,
        this.apiSecret,
      );
      this.logger.log('CoolSMS(Solapi) MessageService 초기화 완료');
    }

    if (!this.senderNumber) {
      this.logger.error(
        '발신번호(COOLSMS_SENDER_NUMBER)가 설정되어 있지 않습니다. 문자 발송 시 실패할 수 있습니다.',
      );
    }
  }

  /**
   * 인증번호 / 알림 문자 발송
   * - to      : 수신 번호 (01012345678 형식 권장)
   * - content : 문자 내용
   */
  async send({ to, content }: SendSmsOptions): Promise<void> {
    // 번호에서 숫자만 남기기
    const normalizedTo = to.replace(/\D/g, '');
    const normalizedFrom = (this.senderNumber || '').replace(/\D/g, '');

    this.logger.log(
      `📨 SMS 발송 요청 => to: ${normalizedTo}, from: ${normalizedFrom}, content: ${content}`,
    );

    if (!this.messageService) {
      this.logger.error('CoolSMS MessageService 미초기화로 인해 발송 불가');
      return; // 일단 에러 던지지 않고 로그만 남김. 필요하면 throw로 바꿔도 됨.
    }

    if (!normalizedFrom) {
      this.logger.error(
        '발신번호가 설정되어 있지 않아 문자 발송을 수행하지 않습니다.',
      );
      return;
    }

    try {
      const response = await this.messageService.send({
        to: normalizedTo,
        from: normalizedFrom,
        text: content,
      });

      this.logger.log(`✅ SMS 발송 성공: ${JSON.stringify(response)}`);
    } catch (error: any) {
      this.logger.error(
        `❌ SMS 발송 실패: ${error?.message || error}`,
        error?.stack,
      );
      // 필요하면 여기서 throw 해서 상위에서 잡도록 할 수도 있음
      // throw new Error('SMS 발송 중 오류가 발생했습니다.');
    }
  }
}
