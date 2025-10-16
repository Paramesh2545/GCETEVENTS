import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, deleteDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface OTPRecord {
  id?: string;
  email: string;
  otp: string;
  userData: any; // Store user registration data
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

class OTPService {
  private readonly COLLECTION_NAME = 'otp_verifications';
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create OTP record in database
   */
  async createOTP(email: string, userData: any): Promise<string> {
    try {
      // Clean up any existing OTPs for this email
      await this.cleanupExpiredOTPs(email);

      const otp = this.generateOTP();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      const otpRecord: Omit<OTPRecord, 'id'> = {
        email,
        otp,
        userData,
        createdAt: now,
        expiresAt,
        isUsed: false
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), otpRecord);
      console.log('OTP created:', { email, otp, id: docRef.id });
      
      return otp;
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  /**
   * Verify OTP against database
   */
  async verifyOTP(email: string, enteredOTP: string): Promise<{ isValid: boolean; userData?: any }> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('email', '==', email),
        where('otp', '==', enteredOTP),
        where('isUsed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { isValid: false };
      }

      const otpDoc = querySnapshot.docs[0];
      const otpData = otpDoc.data() as OTPRecord;

      // Check if OTP is expired
      const now = new Date();
      if (now > otpData.expiresAt) {
        // Mark as used to prevent reuse
        await this.markOTPAsUsed(otpDoc.id);
        return { isValid: false };
      }

      // Mark OTP as used
      await this.markOTPAsUsed(otpDoc.id);

      return { 
        isValid: true, 
        userData: otpData.userData 
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { isValid: false };
    }
  }

  /**
   * Mark OTP as used
   */
  private async markOTPAsUsed(otpId: string): Promise<void> {
    try {
      const otpRef = doc(db, this.COLLECTION_NAME, otpId);
      await deleteDoc(otpRef); // Delete instead of marking as used for security
    } catch (error) {
      console.error('Error marking OTP as used:', error);
    }
  }

  /**
   * Clean up expired OTPs for an email
   */
  private async cleanupExpiredOTPs(email: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);
      const now = new Date();

      const deletePromises = querySnapshot.docs
        .filter(doc => {
          const data = doc.data() as OTPRecord;
          return now > data.expiresAt;
        })
        .map(doc => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Send OTP via email (mock implementation)
   * In production, integrate with email service like SendGrid, AWS SES, etc.
   */
  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
      // Mock email sending - in production, call your email service
      console.log(`📧 Sending OTP to ${email}: ${otp}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, replace this with actual email service call:
      // await emailService.send({
      //   to: email,
      //   subject: 'Your GCET Registration OTP',
      //   html: `Your OTP is: <strong>${otp}</strong><br>This OTP will expire in 10 minutes.`
      // });
      
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  /**
   * Resend OTP for an email
   */
  async resendOTP(email: string, userData: any): Promise<string> {
    try {
      // Clean up existing OTPs first
      await this.cleanupExpiredOTPs(email);
      
      // Create new OTP
      const otp = await this.createOTP(email, userData);
      
      // Send email
      await this.sendOTPEmail(email, otp);
      
      return otp;
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new Error('Failed to resend OTP');
    }
  }
}

export const otpService = new OTPService();
