import React, { useState, useEffect } from 'react';
import { User, Club } from '../types';
import { phonepeAccountService, PhonePeAccount } from '../services/phonepeAccountService';

interface PhonePeAccountManagerProps {
  user: User;
  clubs: Club[];
  onAccountUpdate?: () => void;
}

const PhonePeAccountManager: React.FC<PhonePeAccountManagerProps> = ({
  user,
  clubs,
  onAccountUpdate
}) => {
  const [accounts, setAccounts] = useState<PhonePeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PhonePeAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clubId: '',
    accountName: '',
    merchantId: '',
    saltKey: '',
    saltIndex: '1',
    environment: 'sandbox' as 'sandbox' | 'production',
    phoneNumber: '',
    email: '',
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  // Load user's accounts
  useEffect(() => {
    loadAccounts();
  }, [user.id]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const userAccounts = await phonepeAccountService.getUserAccounts(user.id!);
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.clubId || !formData.merchantId || !formData.saltKey) {
        throw new Error('Please fill in all required fields');
      }

      // Validate credentials
      const isValid = await phonepeAccountService.validateAccountCredentials(
        formData.merchantId,
        formData.saltKey,
        formData.saltIndex
      );

      if (!isValid) {
        throw new Error('Invalid PhonePe credentials. Please check your Merchant ID, Salt Key, and Salt Index.');
      }

      // Create or update account - only include fields that have values
      const accountData: any = {
        userId: user.id!,
        clubId: formData.clubId,
        merchantId: formData.merchantId,
        saltKey: formData.saltKey,
        saltIndex: formData.saltIndex,
        environment: formData.environment,
        isActive: true,
        accountName: formData.accountName
      };

      // Only add optional fields if they have values
      if (formData.phoneNumber.trim()) accountData.phoneNumber = formData.phoneNumber;
      if (formData.email.trim()) {
        // College email validation
        const collegeEmailRegex = /^[a-z0-9._%+-]+@gcet\.edu\.in$/i;
        if (!collegeEmailRegex.test(formData.email)) {
          throw new Error('Only GCET college email addresses are allowed');
        }
        accountData.email = formData.email;
      }
      if (formData.businessName.trim()) accountData.businessName = formData.businessName;
      if (formData.businessType.trim()) accountData.businessType = formData.businessType;
      if (formData.gstNumber.trim()) accountData.gstNumber = formData.gstNumber;
      if (formData.panNumber.trim()) accountData.panNumber = formData.panNumber;
      if (formData.bankAccountNumber.trim()) accountData.bankAccountNumber = formData.bankAccountNumber;
      if (formData.ifscCode.trim()) accountData.ifscCode = formData.ifscCode;
      if (formData.accountHolderName.trim()) accountData.accountHolderName = formData.accountHolderName;

      await phonepeAccountService.createOrUpdateAccount(accountData);
      
      setSuccess(editingAccount ? 'Account updated successfully!' : 'Account created successfully!');
      setShowForm(false);
      setEditingAccount(null);
      resetForm();
      loadAccounts();
      onAccountUpdate?.();
    } catch (error: any) {
      console.error('Error saving account:', error);
      setError(error.message || 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: PhonePeAccount) => {
    setEditingAccount(account);
    setFormData({
      clubId: account.clubId,
      accountName: account.accountName,
      merchantId: account.merchantId,
      saltKey: account.saltKey,
      saltIndex: account.saltIndex,
      environment: account.environment,
      phoneNumber: account.phoneNumber || '',
      email: account.email || '',
      businessName: account.businessName || '',
      businessType: account.businessType || '',
      gstNumber: account.gstNumber || '',
      panNumber: account.panNumber || '',
      bankAccountNumber: account.bankAccountNumber || '',
      ifscCode: account.ifscCode || '',
      accountHolderName: account.accountHolderName || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return;

    try {
      await phonepeAccountService.deactivateAccount(accountId);
      setSuccess('Account deactivated successfully!');
      loadAccounts();
      onAccountUpdate?.();
    } catch (error) {
      console.error('Error deactivating account:', error);
      setError('Failed to deactivate account');
    }
  };

  const resetForm = () => {
    setFormData({
      clubId: '',
      accountName: '',
      merchantId: '',
      saltKey: '',
      saltIndex: '1',
      environment: 'sandbox',
      phoneNumber: '',
      email: '',
      businessName: '',
      businessType: '',
      gstNumber: '',
      panNumber: '',
      bankAccountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">PhonePe Account Management</h2>
          <p className="text-gray-400 mt-1">Configure your PhonePe account to receive payments directly</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Account
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Accounts List */}
      {!showForm && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/50 rounded-lg">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No PhonePe Accounts</h3>
              <p className="text-gray-400 mb-4">You haven't configured any PhonePe accounts yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Your First Account
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const club = clubs.find(c => c.id === account.clubId);
                return (
                  <div key={account.id} className="bg-slate-800 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{account.accountName}</h3>
                        <p className="text-gray-400">{club?.name || 'Unknown Club'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            account.environment === 'production' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {account.environment === 'production' ? 'Production' : 'Sandbox'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(account.id!)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Merchant ID:</span>
                        <span className="text-white ml-2 font-mono">{account.merchantId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Salt Index:</span>
                        <span className="text-white ml-2">{account.saltIndex}</span>
                      </div>
                      {account.businessName && (
                        <div>
                          <span className="text-gray-400">Business:</span>
                          <span className="text-white ml-2">{account.businessName}</span>
                        </div>
                      )}
                      {account.phoneNumber && (
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-white ml-2">{account.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Account Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingAccount ? 'Edit PhonePe Account' : 'Add PhonePe Account'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Club <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.clubId}
                  onChange={(e) => setFormData({...formData, clubId: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Account Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Main Business Account"
                  required
                />
              </div>
            </div>

            {/* PhonePe Credentials */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">PhonePe Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Merchant ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.merchantId}
                    onChange={(e) => setFormData({...formData, merchantId: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="MERCHANT_ID"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Salt Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.saltKey}
                    onChange={(e) => setFormData({...formData, saltKey: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SALT_KEY"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Salt Index <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.saltIndex}
                    onChange={(e) => setFormData({...formData, saltIndex: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({...formData, environment: e.target.value as 'sandbox' | 'production'})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">Business Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Business Type</option>
                    <option value="education">Education</option>
                    <option value="technology">Technology</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="business@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">Bank Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Account Holder Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Bank Account Number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="IFSC Code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="PAN Number"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Saving...' : (editingAccount ? 'Update Account' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PhonePeAccountManager;
