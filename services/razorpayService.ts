import { Event, User } from '../types';

export interface RazorpayPaymentRequest {
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
  clubId?: string;
  subMerchantAccountId?: string;
  mode: 'sandbox' | 'production';
}

export interface RazorpayPaymentResponse {
  success: boolean;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    eventId: string;
    eventName: string;
    customerId: string;
  };
}

export interface RazorpayPaymentStatus {
  success: boolean;
  orderId: string;
  paymentId: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  method: string;
  description: string;
  vpa?: string;
  email: string;
  contact: string;
  notes: {
    eventId: string;
    eventName: string;
    customerId: string;
  };
  created_at: number;
  captured_at?: number;
}

class RazorpayService {
  private baseUrl = 'https://us-central1-evnty-124fb.cloudfunctions.net';

  async createPaymentOrder(paymentRequest: RazorpayPaymentRequest): Promise<RazorpayPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/createRazorpayOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Razorpay payment order creation failed:', error);
      throw error;
    }
  }

  async verifyPaymentStatus(orderId: string): Promise<RazorpayPaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/getRazorpayPaymentStatus?orderId=${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Razorpay payment status verification failed:', error);
      throw error;
    }
  }

  async handlePaymentCallback(callbackData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/handleRazorpayCallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callbackData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Razorpay payment callback handling failed:', error);
      throw error;
    }
  }

  createPaymentRequest(
    event: Event,
    user: User,
    registrationId: string,
    mode: 'sandbox' | 'production' = 'sandbox'
  ): RazorpayPaymentRequest {
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

  // Initialize Razorpay payment
  async initializePayment(paymentData: RazorpayPaymentResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: paymentData.name,
          description: paymentData.description,
          order_id: paymentData.razorpayOrderId,
          prefill: paymentData.prefill,
          notes: paymentData.notes,
          handler: function (response: any) {
            resolve(response);
          },
          modal: {
            ondismiss: function () {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay SDK'));
      };
      document.head.appendChild(script);
    });
  }
}

export const razorpayService = new RazorpayService();
