import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../frontend/firebaseConfig';

// Firebase Functions - using callable functions to avoid CORS issues
// export const testFunction = httpsCallable(functions, 'testFunction');
// export const testFirestoreFunction = httpsCallable(functions, 'testFirestore');
// export const getUserDataFunction = httpsCallable(functions, 'getUserData');

// // Example function to call the test API
// export const callTestFunction = async (message: string) => {
//   try {
//     const result = await testFunction({ message });
//     return result.data;
//   } catch (error) {
//     console.error('Error calling test function:', error);
//     throw error;
//   }
// };

// // Example function to test Firestore
// export const testFirestore = async () => {
//   try {
//     const result = await testFirestoreFunction({});
//     return result.data;
//   } catch (error) {
//     console.error('Error testing Firestore:', error);
//     throw error;
//   }
// };

// // Function to get user data from Firebase
// export const getUserData = async (userId?: string) => {
//   try {
//     const result = await getUserDataFunction({ userId });
//     return result.data;
//   } catch (error) {
//     console.error('Error getting user data:', error);
//     throw error;
//   }
// };

// Basic Firestore helper functions (for future use)
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const getCollection = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
