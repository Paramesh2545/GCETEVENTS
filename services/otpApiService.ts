import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

class OTPApiService {
  /**
   * Generate OTP for user registration
   */
  async generateOTP(email: string, userData: any): Promise<{ success: boolean; message: string; otpId?: string }> {
    try {
      const generateOTPFunction = httpsCallable(functions, 'generateOTP');
      const result = await generateOTPFunction({ email, userData });
      return result.data as { success: boolean; message: string; otpId?: string };
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      throw new Error(error.message || 'Failed to generate OTP');
    }
  }

  /**
   * Verify OTP entered by user
   */
  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string; userData?: any }> {
    try {
      const verifyOTPFunction = httpsCallable(functions, 'verifyOTP');
      const result = await verifyOTPFunction({ email, otp });
      return result.data as { success: boolean; message: string; userData?: any };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    }
  }

  /**
   * Resend OTP to user
   */
  async resendOTP(email: string, userData: any): Promise<{ success: boolean; message: string; otpId?: string }> {
    try {
      const resendOTPFunction = httpsCallable(functions, 'resendOTP');
      const result = await resendOTPFunction({ email, userData });
      return result.data as { success: boolean; message: string; otpId?: string };
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      throw new Error(error.message || 'Failed to resend OTP');
    }
  }
}

export const otpApiService = new OTPApiService();
