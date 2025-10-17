import React, { useState } from 'react';
import { X, User, Mail, Phone } from 'lucide-react';

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestLogin: (guestData: GuestUserData) => void;
}

export interface GuestUserData {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  department: string;
}

const GuestLoginModal: React.FC<GuestLoginModalProps> = ({ isOpen, onClose, onGuestLogin }) => {
  const [formData, setFormData] = useState<GuestUserData>({
    name: '',
    email: '',
    phone: '',
    college: 'GCET',
    year: '1',
    department: 'CSE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Basic validation
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return;
      }

      // Basic email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Phone validation
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      // Call the parent callback with guest data
      onGuestLogin(formData);
      
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Guest login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof GuestUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Guest Registration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your.email@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="9876543210"
              maxLength={10}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="AERO">AERO</option>
                <option value="AUTO">AUTO</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-500/20 rounded">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Guest Access</p>
                <p className="text-blue-400/80">
                  As a guest, you can register for events but cannot join clubs or access admin features.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Registering...' : 'Register as Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestLoginModal;
