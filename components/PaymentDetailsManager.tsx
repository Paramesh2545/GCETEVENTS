import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

interface PaymentDetails {
  name: string;
  email: string;
  phone: string;
  type: 'route' | 'marketplace';
  business_type: 'individual' | 'company' | 'partnership' | 'llp' | 'trust' | 'ngo';
  bank_account: {
    name: string;
    ifsc: string;
    account_number: string;
  };
  linked_account_id?: string;
  status?: 'pending' | 'active' | 'suspended';
  created_at?: any;
  updated_at?: any;
}

interface PaymentDetailsManagerProps {
  clubId: string;
  clubName: string;
  isAdmin: boolean;
}

const PaymentDetailsManager: React.FC<PaymentDetailsManagerProps> = ({
  clubId,
  clubName,
  isAdmin
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    name: '',
    email: '',
    phone: '',
    type: 'route',
    business_type: 'individual',
    bank_account: {
      name: '',
      ifsc: '',
      account_number: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExistingDetails, setHasExistingDetails] = useState(false);

  useEffect(() => {
    if (isAdmin && clubId) {
      loadPaymentDetails();
    }
  }, [isAdmin, clubId]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const paymentDocRef = doc(db, 'clubs', clubId, 'paymentDetails', 'razorpay');
      const paymentDoc = await getDoc(paymentDocRef);
      
      if (paymentDoc.exists()) {
        const data = paymentDoc.data() as PaymentDetails;
        setPaymentDetails(data);
        setHasExistingDetails(true);
      }
    } catch (err) {
      console.error('Error loading payment details:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPaymentDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PaymentDetails],
          [child]: value
        }
      }));
    } else {
      setPaymentDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!paymentDetails.name.trim()) {
      setError('Vendor name is required');
      return false;
    }
    if (!paymentDetails.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // College email validation
    const collegeEmailRegex = /^[a-z0-9._%+-]+@gcet\.edu\.in$/i;
    if (!collegeEmailRegex.test(paymentDetails.email)) {
      setError('Only GCET college email addresses are allowed');
      return false;
    }
    if (!paymentDetails.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!paymentDetails.bank_account.name.trim()) {
      setError('Bank account holder name is required');
      return false;
    }
    if (!paymentDetails.bank_account.ifsc.trim()) {
      setError('IFSC code is required');
      return false;
    }
    if (!paymentDetails.bank_account.account_number.trim()) {
      setError('Account number is required');
      return false;
    }
    return true;
  };

  const createSubMerchant = async (): Promise<string> => {
    const response = await fetch('https://us-central1-evnty-124fb.cloudfunctions.net/createRazorpaySubMerchant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create sub-merchant');
    }

    const data = await response.json();
    return data.linked_account_id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Create sub-merchant if not already created
      let linkedAccountId = paymentDetails.linked_account_id;
      if (!linkedAccountId) {
        linkedAccountId = await createSubMerchant();
      }

      // Save payment details to Firestore
      const paymentData = {
        ...paymentDetails,
        linked_account_id: linkedAccountId,
        status: 'active',
        updated_at: new Date(),
        created_at: hasExistingDetails ? paymentDetails.created_at : new Date()
      };

      const paymentDocRef = doc(db, 'clubs', clubId, 'paymentDetails', 'razorpay');
      await setDoc(paymentDocRef, paymentData);

      setPaymentDetails(paymentData);
      setHasExistingDetails(true);
      setSuccess('Payment details saved successfully! Sub-merchant account created.');
    } catch (err: any) {
      console.error('Error saving payment details:', err);
      setError(err.message || 'Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Only club admins can manage payment details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading payment details...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Payment Details Management</h2>
        <p className="text-gray-300">Configure payment details for {clubName} to enable direct payments to your account.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vendor Name *
            </label>
            <input
              type="text"
              value={paymentDetails.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={paymentDetails.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={paymentDetails.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Type *
            </label>
            <select
              value={paymentDetails.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="route">Route</option>
              <option value="marketplace">Marketplace</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Type *
            </label>
            <select
              value={paymentDetails.business_type}
              onChange={(e) => handleInputChange('business_type', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="partnership">Partnership</option>
              <option value="llp">LLP</option>
              <option value="trust">Trust</option>
              <option value="ngo">NGO</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-600 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bank Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={paymentDetails.bank_account.name}
                onChange={(e) => handleInputChange('bank_account.name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter account holder name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                value={paymentDetails.bank_account.ifsc}
                onChange={(e) => handleInputChange('bank_account.ifsc', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter IFSC code"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={paymentDetails.bank_account.account_number}
                onChange={(e) => handleInputChange('bank_account.account_number', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter account number"
                required
              />
            </div>
          </div>
        </div>

        {paymentDetails.linked_account_id && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">Sub-Merchant Account Status</h4>
            <p className="text-blue-300">
              <strong>Linked Account ID:</strong> {paymentDetails.linked_account_id}
            </p>
            <p className="text-blue-300">
              <strong>Status:</strong> {paymentDetails.status || 'Pending Verification'}
            </p>
            <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> This is a mock sub-merchant account. To create real Razorpay sub-merchants:
              </p>
              <ul className="text-yellow-300 text-sm mt-2 ml-4 list-disc">
                <li>Set up a Razorpay Partner account</li>
                <li>Use Razorpay Partners API for sub-merchant creation</li>
                <li>Complete KYC process for each sub-merchant</li>
                <li>Contact Razorpay support for Partner API access</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={loadPaymentDetails}
            className="px-4 py-2 border border-slate-600 rounded-md text-gray-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : hasExistingDetails ? 'Update Details' : 'Create Sub-Merchant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentDetailsManager;
