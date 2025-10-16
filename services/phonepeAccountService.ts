import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../frontend/firebaseConfig';

export interface PhonePeAccount {
  id?: string;
  userId: string; // Organizer's user ID
  clubId: string; // Club ID for which this account is configured
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  environment: 'sandbox' | 'production';
  isActive: boolean;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  accountName: string; // Custom name for the account
  phoneNumber?: string;
  email?: string;
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

export interface PaymentConfiguration {
  id?: string;
  clubId: string;
  eventId: string;
  phonePeAccountId: string;
  isEnabled: boolean;
  createdAt: any;
  updatedAt: any;
}

class PhonePeAccountService {
  private accountsCollection = 'phonepeAccounts';
  private configurationsCollection = 'paymentConfigurations';

  // Create or update PhonePe account for organizer
  async createOrUpdateAccount(accountData: Omit<PhonePeAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Clean undefined values from accountData
      const cleanedAccountData = this.cleanUndefinedValues(accountData);
      
      // Check if account already exists for this user and club
      const existingAccount = await this.getAccountByUserAndClub(accountData.userId, accountData.clubId);
      
      if (existingAccount) {
        // Update existing account
        const accountRef = doc(db, this.accountsCollection, existingAccount.id!);
        await updateDoc(accountRef, {
          ...cleanedAccountData,
          updatedAt: serverTimestamp()
        });
        return existingAccount.id!;
      } else {
        // Create new account
        const newAccount: Omit<PhonePeAccount, 'id'> = {
          ...cleanedAccountData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, this.accountsCollection), newAccount);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating/updating PhonePe account:', error);
      throw error;
    }
  }

  // Helper method to clean undefined values from object
  private cleanUndefinedValues(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          const cleanedNested = this.cleanUndefinedValues(obj[key]);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  }

  // Get PhonePe account by user and club
  async getAccountByUserAndClub(userId: string, clubId: string): Promise<PhonePeAccount | null> {
    try {
      const q = query(
        collection(db, this.accountsCollection),
        where('userId', '==', userId),
        where('clubId', '==', clubId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as PhonePeAccount;
    } catch (error) {
      console.error('Error getting PhonePe account:', error);
      return null;
    }
  }

  // Get all accounts for a user
  async getUserAccounts(userId: string): Promise<PhonePeAccount[]> {
    try {
      const q = query(
        collection(db, this.accountsCollection),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PhonePeAccount));
    } catch (error) {
      console.error('Error getting user accounts:', error);
      return [];
    }
  }

  // Get all accounts for a club
  async getClubAccounts(clubId: string): Promise<PhonePeAccount[]> {
    try {
      const q = query(
        collection(db, this.accountsCollection),
        where('clubId', '==', clubId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PhonePeAccount));
    } catch (error) {
      console.error('Error getting club accounts:', error);
      return [];
    }
  }

  // Get account by ID
  async getAccountById(accountId: string): Promise<PhonePeAccount | null> {
    try {
      const q = query(
        collection(db, this.accountsCollection),
        where('__name__', '==', accountId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as PhonePeAccount;
    } catch (error) {
      console.error('Error getting account by ID:', error);
      return null;
    }
  }

  // Deactivate account
  async deactivateAccount(accountId: string): Promise<void> {
    try {
      const accountRef = doc(db, this.accountsCollection, accountId);
      await updateDoc(accountRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deactivating account:', error);
      throw error;
    }
  }

  // Configure payment for an event
  async configureEventPayment(configData: Omit<PaymentConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newConfig: Omit<PaymentConfiguration, 'id'> = {
        ...configData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.configurationsCollection), newConfig);
      return docRef.id;
    } catch (error) {
      console.error('Error configuring event payment:', error);
      throw error;
    }
  }

  // Get payment configuration for an event
  async getEventPaymentConfig(eventId: string): Promise<PaymentConfiguration | null> {
    try {
      const q = query(
        collection(db, this.configurationsCollection),
        where('eventId', '==', eventId),
        where('isEnabled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as PaymentConfiguration;
    } catch (error) {
      console.error('Error getting event payment config:', error);
      return null;
    }
  }

  // Update payment configuration
  async updatePaymentConfig(configId: string, updates: Partial<PaymentConfiguration>): Promise<void> {
    try {
      const configRef = doc(db, this.configurationsCollection, configId);
      await updateDoc(configRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating payment config:', error);
      throw error;
    }
  }

  // Get payment statistics for an account
  async getAccountPaymentStats(accountId: string): Promise<{
    totalEvents: number;
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
  }> {
    try {
      // This would typically query payment records
      // For now, return mock data
      return {
        totalEvents: 0,
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalEvents: 0,
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0
      };
    }
  }

  // Validate PhonePe account credentials
  async validateAccountCredentials(merchantId: string, saltKey: string, saltIndex: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call to PhonePe
      // to validate the credentials
      // For now, return true for demo purposes
      return true;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
    }
  }
}

export const phonepeAccountService = new PhonePeAccountService();
