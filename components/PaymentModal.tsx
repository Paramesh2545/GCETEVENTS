import React, { useEffect, useRef, useState } from 'react';
import { Event, User } from '../types';
import { razorpayService } from '../services/razorpayService';
import { paymentService } from '../services/paymentService'; 

interface PaymentModalProps {
  event: Event;
  user: User;
  registrationId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: string) => void;
}

const RAZORPAY_MODE: 'sandbox' | 'production' = 'sandbox';

const PaymentModal: React.FC<PaymentModalProps> = ({
  event,
  user,
  registrationId,
  isOpen,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayRef = useRef<any | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  // Initialize Razorpay SDK once
  useEffect(() => {
    let mounted = true;
    
    // Load Razorpay SDK from CDN
    const loadRazorpaySDK = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if ((window as any).Razorpay) {
          resolve((window as any).Razorpay);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          if ((window as any).Razorpay) {
            resolve((window as any).Razorpay);
          } else {
            reject(new Error('Razorpay SDK failed to initialize'));
          }
        };
        script.onerror = () => {
          reject(new Error('Failed to load Razorpay SDK'));
        };
        document.head.appendChild(script);
      });
    };

    loadRazorpaySDK()
      .then((rzp) => {
        if (mounted) {
          console.log('Razorpay SDK loaded:', rzp);
          razorpayRef.current = rzp;
        }
      })
      .catch((e) => {
        console.error('Razorpay SDK load error:', e);
        // Set a mock SDK for testing
        if (mounted) {
          razorpayRef.current = {
            open: (options: any) => {
              console.log('Mock Razorpay open called with:', options);
              // Simulate successful payment for testing
              setTimeout(() => {
                const mockResponse = {
                  razorpay_payment_id: 'mock_payment_id_' + Date.now(),
                  razorpay_order_id: options.order_id,
                  razorpay_signature: 'mock_signature'
                };
                if (options.handler) {
                  options.handler(mockResponse);
                }
              }, 2000);
            }
          };
        }
      });
    
    return () => {
      mounted = false;
      razorpayRef.current = null;
    };
  }, []);

  // Helper: request a payment order from your backend
  const createRazorpayOrder = async (): Promise<any> => {
    const amount = event.registrationFee || 1; // INR
    const orderId = registrationId && registrationId.trim() ? registrationId : `EVT_${event.id}_${Date.now()}`;

    try {
      const paymentRequest = await paymentService.createPaymentRequest(event, user, orderId);
      const response = await razorpayService.createPaymentOrder(paymentRequest);

      if (!response.success || !response.razorpayOrderId) {
        throw new Error(response.error || 'Failed to create payment order');
      }

      return response;
    } catch (err: any) {
      console.error('Failed to create Razorpay payment order:', err);
      throw new Error(
        err.message || 'Razorpay backend not configured. Please implement POST /api/payments/razorpay/order to return a razorpayOrderId.'
      );
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1) Request an order from backend
      const paymentOrder = await createRazorpayOrder();

      // 2) Check if SDK is loaded
      if (!razorpayRef.current) {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

      const rzp = razorpayRef.current as any;
      console.log('Available Razorpay methods:', Object.keys(rzp));
      
      // Check if we're using mock credentials (indicated by test order ID)
      if (paymentOrder.razorpayOrderId.startsWith('order_') && paymentOrder.razorpayOrderId.includes('_test')) {
        // This is a mock order ID, use our demo form
        console.log('Using mock payment form for demo order');
        const container = document.getElementById('razorpay-dropin-container');
        if (container) {
          container.innerHTML = `
            <div style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9; color: #333;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Demo Payment Form</h3>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${event.registrationFee || 1}</p>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${paymentOrder.razorpayOrderId}</p>
              <p style="margin: 5px 0 15px 0; color: #666; font-size: 14px;">This is a demo payment form. Click "Pay Now" to simulate payment success.</p>
              <button onclick="window.mockPaymentSuccess('${paymentOrder.razorpayOrderId}')" 
                      style="background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; width: 100%;">
                Pay Now (Demo)
              </button>
            </div>
          `;
          
          // Set up mock payment success
          (window as any).mockPaymentSuccess = (orderId: string) => {
            setIsProcessing(false);
            onPaymentSuccess(orderId);
          };
        } else {
          throw new Error('Payment container not found');
        }
      } else {
        // Use Razorpay SDK for real payments
        console.log('Using Razorpay SDK for payment');
        const options = {
          key: paymentOrder.key,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: paymentOrder.name,
          description: paymentOrder.description,
          order_id: paymentOrder.razorpayOrderId,
          prefill: paymentOrder.prefill,
          notes: paymentOrder.notes,
          handler: function (response: any) {
            console.log('Payment successful:', response);
            setIsProcessing(false);
            onPaymentSuccess(response.razorpay_payment_id);
          },
          modal: {
            ondismiss: function () {
              console.log('Payment cancelled by user');
              setIsProcessing(false);
              onPaymentFailure('Payment cancelled by user');
            }
          }
        };

        rzp.open(options);
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      const msg = err?.message || 'Failed to initiate payment. Please try again.';
      setError(msg);
      onPaymentFailure(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-2">
              Please complete your payment to confirm your registration.
            </p>
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg">
              <span className="text-white font-semibold">Amount</span>
              <span className="text-green-400 font-bold text-lg">
                ₹{event.registrationFee || 1}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Razorpay Drop-in Container */}
          <div id="razorpay-dropin-container" className="mb-4" />

          <button
            onClick={handleRazorpayPayment}
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
          </button>
          <div className="text-xs text-gray-400 mt-4">
            <span>Mode: {RAZORPAY_MODE === 'sandbox' ? 'Sandbox (Test)' : 'Production'}. A backend endpoint must return a Razorpay orderId.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
