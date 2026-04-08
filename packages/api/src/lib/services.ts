import { AppServices, AuthService, NotificationService, PaystackService, PaystackVerification } from '../domain.js';

export class StaticAuthService implements AuthService {
  async verifyAccessToken(token: string) {
    if (!token.startsWith('clerk_')) {
      throw new Error('Invalid token');
    }

    return { sub: token.replace('clerk_', '') };
  }
}

export class StaticPaystackService implements PaystackService {
  async verifyTransaction(reference: string): Promise<PaystackVerification> {
    return {
      reference,
      status: 'success',
      amountMinor: 0,
      currency: 'GHS',
      paidAt: new Date().toISOString(),
      channel: 'card'
    };
  }
}

export class InMemoryNotificationService implements NotificationService {
  readonly sent: Array<{
    userId: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
  }> = [];

  async send(userId: string, type: string, title: string, body: string, data: Record<string, unknown> = {}) {
    this.sent.push({ userId, type, title, body, data });
  }
}

export function createDefaultServices(overrides: Partial<AppServices> = {}): AppServices {
  return {
    auth: overrides.auth ?? new StaticAuthService(),
    paystack: overrides.paystack ?? new StaticPaystackService(),
    notifications: overrides.notifications ?? new InMemoryNotificationService(),
    qrJwtSecret: overrides.qrJwtSecret ?? 'test-qr-secret',
    paystackWebhookSecret: overrides.paystackWebhookSecret ?? 'test-paystack-secret',
    now: overrides.now ?? (() => new Date())
  };
}
