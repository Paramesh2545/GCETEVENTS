import { Event, User } from '../types';
import { razorpayService } from './razorpayService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PaymentRequest {
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
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paymentMethod?: string;
  timestamp: string;
}

class PaymentService {
  /**
   * Initiate Razorpay payment
   */
  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const orderId = `EVENT_${paymentRequest.eventId}_${Date.now()}`;
      
      const razorpayRequest = {
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        orderId: orderId,
        customerId: paymentRequest.customerId,
        customerName: paymentRequest.customerName,
        customerEmail: paymentRequest.customerEmail,
        customerPhone: paymentRequest.customerPhone,
        eventId: paymentRequest.eventId,
        eventName: paymentRequest.eventName,
        description: paymentRequest.description,
        clubId: paymentRequest.clubId,
        subMerchantAccountId: paymentRequest.subMerchantAccountId,
        mode: 'sandbox' as 'sandbox' | 'production'
      };

      const response = await razorpayService.createPaymentOrder(razorpayRequest);
      
      if (response.success && response.razorpayOrderId) {
        return {
          success: true,
          paymentId: response.razorpayOrderId,
          paymentUrl: response.razorpayOrderId, // For Razorpay, we use the order ID
          orderId: response.orderId || orderId
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to initiate payment'
        };
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        error: 'Failed to initiate payment. Please try again.'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      return await razorpayService.verifyPaymentStatus(paymentId);
    } catch (error) {
      console.error('Payment status check failed:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Verify payment callback (to be called from backend)
   */
  async verifyPaymentCallback(callbackData: any): Promise<boolean> {
    try {
      return await razorpayService.handlePaymentCallback(callbackData);
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  /**
   * Fetch sub-merchant account ID for a club
   */
  async getSubMerchantAccountId(clubId: string): Promise<string | null> {
    try {
      const paymentDocRef = doc(db, 'clubs', clubId, 'paymentDetails', 'razorpay');
      const paymentDoc = await getDoc(paymentDocRef);
      
      if (paymentDoc.exists()) {
        const data = paymentDoc.data();
        return data.linked_account_id || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching sub-merchant account ID:', error);
      return null;
    }
  }

  /**
   * Create payment request for event registration
   */
  async createPaymentRequest(
    event: Event, 
    user: User, 
    registrationId: string
  ): Promise<PaymentRequest> {
    // Fetch sub-merchant account ID for the club
    const subMerchantAccountId = await this.getSubMerchantAccountId(event.organizerClubId);
    
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
      clubId: event.organizerClubId,
      subMerchantAccountId: subMerchantAccountId
    };
  }
}

export const paymentService = new PaymentService();
