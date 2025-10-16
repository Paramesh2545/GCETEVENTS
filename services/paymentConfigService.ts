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

export interface PaymentConfig {
  id?: string;
  eventId: string;
  phonePeAccountId: string;
  isEnabled: boolean;
  customFee?: number;
  paymentDescription?: string;
  refundPolicy?: string;
  paymentDeadline?: string;
  specialInstructions?: string;
  organizerId: string;
  clubId: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

class PaymentConfigService {
  private collectionName = 'paymentConfigurations';

  // Create payment configuration for an event
  async createPaymentConfig(configData: Omit<PaymentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Clean undefined values
      const cleanedData = this.cleanUndefinedValues(configData);
      
      const newConfig: Omit<PaymentConfig, 'id'> = {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), newConfig);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment config:', error);
      throw error;
    }
  }

  // Get payment configuration for an event
  async getEventPaymentConfig(eventId: string): Promise<PaymentConfig | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('eventId', '==', eventId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as PaymentConfig;
    } catch (error) {
      console.error('Error getting event payment config:', error);
      return null;
    }
  }

  // Update payment configuration
  async updatePaymentConfig(configId: string, updates: Partial<PaymentConfig>): Promise<void> {
    try {
      const configRef = doc(db, this.collectionName, configId);
      const cleanedUpdates = this.cleanUndefinedValues(updates);
      
      await updateDoc(configRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating payment config:', error);
      throw error;
    }
  }

  // Delete payment configuration
  async deletePaymentConfig(configId: string): Promise<void> {
    try {
      const configRef = doc(db, this.collectionName, configId);
      await deleteDoc(configRef);
    } catch (error) {
      console.error('Error deleting payment config:', error);
      throw error;
    }
  }

  // Get all payment configurations for an organizer
  async getOrganizerPaymentConfigs(organizerId: string): Promise<PaymentConfig[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizerId', '==', organizerId),
        where('isEnabled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentConfig));
    } catch (error) {
      console.error('Error getting organizer payment configs:', error);
      return [];
    }
  }

  // Get payment configurations for a club
  async getClubPaymentConfigs(clubId: string): Promise<PaymentConfig[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clubId', '==', clubId),
        where('isEnabled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentConfig));
    } catch (error) {
      console.error('Error getting club payment configs:', error);
      return [];
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
}

export const paymentConfigService = new PaymentConfigService();
