import React, { useState, useEffect } from 'react';
import { Event, User, Club } from '../types';
import { phonepeAccountService, PhonePeAccount } from '../services/phonepeAccountService';
import { paymentConfigService, PaymentConfig } from '../services/paymentConfigService';

interface EventPaymentConfigProps {
  event: Event;
  user: User;
  clubs: Club[];
  onConfigUpdate?: () => void;
}

const EventPaymentConfig: React.FC<EventPaymentConfigProps> = ({
  event,
  user,
  clubs,
  onConfigUpdate
}) => {
  const [availableAccounts, setAvailableAccounts] = useState<PhonePeAccount[]>([]);
  const [currentConfig, setCurrentConfig] = useState<PaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    phonePeAccountId: '',
    isEnabled: true,
    customFee: event.registrationFee || 0,
    paymentDescription: `Registration for ${event.name}`,
    refundPolicy: '',
    paymentDeadline: '',
    specialInstructions: ''
  });

  useEffect(() => {
    loadData();
  }, [event.id, user.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load user's available PhonePe accounts
      const accounts = await phonepeAccountService.getUserAccounts(user.id!);
      setAvailableAccounts(accounts);

      // Load current payment configuration for this event
      const config = await paymentConfigService.getEventPaymentConfig(event.id);
      setCurrentConfig(config);

      if (config) {
        setFormData({
          phonePeAccountId: config.phonePeAccountId,
          isEnabled: config.isEnabled,
          customFee: config.customFee || event.registrationFee || 0,
          paymentDescription: config.paymentDescription || `Registration for ${event.name}`,
          refundPolicy: config.refundPolicy || '',
          paymentDeadline: config.paymentDeadline || '',
          specialInstructions: config.specialInstructions || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
      setError('Failed to load payment configuration');
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
      if (!formData.phonePeAccountId) {
        throw new Error('Please select a PhonePe account');
      }

      const configData = {
        eventId: event.id,
        phonePeAccountId: formData.phonePeAccountId,
        isEnabled: formData.isEnabled,
        customFee: formData.customFee,
        paymentDescription: formData.paymentDescription,
        refundPolicy: formData.refundPolicy || undefined,
        paymentDeadline: formData.paymentDeadline || undefined,
        specialInstructions: formData.specialInstructions || undefined,
        organizerId: user.id!,
        clubId: event.organizerClubId
      };

      if (currentConfig) {
        await paymentConfigService.updatePaymentConfig(currentConfig.id!, configData);
        setSuccess('Payment configuration updated successfully!');
      } else {
        await paymentConfigService.createPaymentConfig(configData);
        setSuccess('Payment configuration created successfully!');
      }

      setShowForm(false);
      loadData();
      onConfigUpdate?.();
    } catch (error: any) {
      console.error('Error saving payment config:', error);
      setError(error.message || 'Failed to save payment configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentConfig || !window.confirm('Are you sure you want to delete this payment configuration?')) return;

    try {
      await paymentConfigService.deletePaymentConfig(currentConfig.id!);
      setSuccess('Payment configuration deleted successfully!');
      setCurrentConfig(null);
      setFormData({
        phonePeAccountId: '',
        isEnabled: true,
        customFee: event.registrationFee || 0,
        paymentDescription: `Registration for ${event.name}`,
        refundPolicy: '',
        paymentDeadline: '',
        specialInstructions: ''
      });
      onConfigUpdate?.();
    } catch (error) {
      console.error('Error deleting payment config:', error);
      setError('Failed to delete payment configuration');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading payment configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Payment Configuration</h2>
          <p className="text-gray-400 mt-1">Configure payment settings for {event.name}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {currentConfig ? 'Edit Configuration' : 'Configure Payment'}
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

      {/* Current Configuration */}
      {currentConfig && !showForm && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Current Configuration</h3>
              <p className="text-gray-400">Payment settings for this event</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                currentConfig.isEnabled 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentConfig.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Registration Fee:</span>
              <span className="text-white ml-2">₹{currentConfig.customFee}</span>
            </div>
            <div>
              <span className="text-gray-400">PhonePe Account:</span>
              <span className="text-white ml-2">
                {availableAccounts.find(acc => acc.id === currentConfig.phonePeAccountId)?.accountName || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Payment Description:</span>
              <span className="text-white ml-2">{currentConfig.paymentDescription}</span>
            </div>
          </div>

          {currentConfig.refundPolicy && (
            <div className="mt-4">
              <span className="text-gray-400">Refund Policy:</span>
              <p className="text-white mt-1">{currentConfig.refundPolicy}</p>
            </div>
          )}

          {currentConfig.paymentDeadline && (
            <div className="mt-4">
              <span className="text-gray-400">Payment Deadline:</span>
              <p className="text-white mt-1">{currentConfig.paymentDeadline}</p>
            </div>
          )}

          {currentConfig.specialInstructions && (
            <div className="mt-4">
              <span className="text-gray-400">Special Instructions:</span>
              <p className="text-white mt-1">{currentConfig.specialInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* No Configuration */}
      {!currentConfig && !showForm && (
        <div className="text-center py-8 bg-slate-800/50 rounded-lg">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Payment Configuration</h3>
          <p className="text-gray-400 mb-4">This event doesn't have payment configuration yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Configure Payment
          </button>
        </div>
      )}

      {/* Configuration Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {currentConfig ? 'Edit Payment Configuration' : 'Create Payment Configuration'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  PhonePe Account <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.phonePeAccountId}
                  onChange={(e) => setFormData({...formData, phonePeAccountId: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a PhonePe account</option>
                  {availableAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} ({account.environment})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                    className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-white">Enable payment for this event</span>
                </label>
              </div>
            </div>

            {/* Fee Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Registration Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.customFee}
                  onChange={(e) => setFormData({...formData, customFee: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Event default: ₹{event.registrationFee || 0}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Description
                </label>
                <input
                  type="text"
                  value={formData.paymentDescription}
                  onChange={(e) => setFormData({...formData, paymentDescription: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Registration for Code-a-thon 2024"
                />
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Refund Policy (Optional)
                </label>
                <textarea
                  value={formData.refundPolicy}
                  onChange={(e) => setFormData({...formData, refundPolicy: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Full refund if cancelled 24 hours before event"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.paymentDeadline}
                  onChange={(e) => setFormData({...formData, paymentDeadline: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Payment includes lunch and t-shirt"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                {isLoading ? 'Saving...' : (currentConfig ? 'Update Configuration' : 'Create Configuration')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventPaymentConfig;
