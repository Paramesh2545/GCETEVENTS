import { Event, User } from '../types';

export interface CashfreePaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventId: string;
  eventName: string;
  description: string;
  mode: 'sandbox' | 'production';
}

export interface CashfreePaymentResponse {
  success: boolean;
  paymentSessionId?: string;
  orderId?: string;
  error?: string;
}

export interface CashfreePaymentStatus {
  paymentId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paymentMethod?: string;
  timestamp: string;
}

class CashfreeService {
  private baseUrl = 'https://us-central1-evnty-124fb.cloudfunctions.net'; // Replace with your actual Firebase Functions URL

  /**
   * Create a payment session with Cashfree
   */
  async createPaymentSession(paymentRequest: CashfreePaymentRequest): Promise<CashfreePaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/createCashfreeSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.paymentSessionId) {
        throw new Error('Payment session ID not received from server');
      }

      return {
        success: true,
        paymentSessionId: data.paymentSessionId,
        orderId: data.orderId || paymentRequest.orderId,
      };
    } catch (error) {
      console.error('Cashfree payment session creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment session',
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(orderId: string): Promise<CashfreePaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/getCashfreePaymentStatus?orderId=${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        paymentId: data.paymentId || orderId,
        orderId: orderId,
        status: data.status || 'pending',
        amount: data.amount || 0,
        currency: data.currency || 'INR',
        transactionId: data.transactionId,
        paymentMethod: data.paymentMethod,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Payment status verification failed:', error);
      throw new Error('Failed to verify payment status');
    }
  }

  /**
   * Handle payment callback (webhook)
   */
  async handlePaymentCallback(callbackData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/handleCashfreeCallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callbackData),
      });

      return response.ok;
    } catch (error) {
      console.error('Payment callback handling failed:', error);
      return false;
    }
  }

  /**
   * Create payment request for event registration
   */
  createPaymentRequest(
    event: Event,
    user: User,
    registrationId: string,
    mode: 'sandbox' | 'production' = 'sandbox'
  ): CashfreePaymentRequest {
    return {
      amount: event.registrationFee || 0,
      currency: 'INR',
      orderId: registrationId,
      customerId: user.id || 'unknown',
      customerName: user.name,
      customerEmail: user.email || '',
      customerPhone: user.mobile || '',
      eventId: event.id,
      eventName: event.name,
      description: `Registration for ${event.name}`,
      mode: mode,
    };
  }

  /**
   * Get Cashfree configuration
   */
  getConfig() {
    return {
      mode: (import.meta as any)?.env?.VITE_CASHFREE_MODE || 'sandbox',
      appId: (import.meta as any)?.env?.VITE_CASHFREE_APP_ID || '',
    };
  }
}

export const cashfreeService = new CashfreeService();
