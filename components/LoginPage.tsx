import React, { useState } from 'react';
import PasswordField from './PasswordField';
import ForgotPasswordModal from './ForgotPasswordModal';
import OTPVerificationModal from './OTPVerificationModal';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { userProfileService } from '../services/firebaseAuthService';
import { otpApiService } from '../services/otpApiService';
import { User } from '../types';

type View = 'login' | 'signup' | 'guest';

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onGuestClick: () => void;
    onSignUpClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGuestClick, onSignUpClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        // College email validation
        const collegeEmailRegex = /^[a-z0-9._%+-]+@gcet\.edu\.in$/i;
        if (!collegeEmailRegex.test(email)) {
            setError('Only GCET college email addresses are allowed.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onLogin(email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <div className="w-full max-w-md animate-flip-in">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-white tracking-tighter">GCET</h1>
                <p className="text-gray-400 mt-2">Welcome back! Please sign in to continue.</p>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <PasswordField
                        label="Password"
                        id="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-900 text-gray-400">Or continue with</span>
                    </div>
                </div>

                
                <div className="text-center mt-6 space-y-2">
                     <p className="text-sm text-gray-400">
                        New student?{' '}
                        <button onClick={onSignUpClick} className="font-medium text-indigo-400 hover:text-indigo-300">
                            Create an account
                        </button>
                    </p>
                    <p className="text-sm text-gray-400">
                        Other college student?{' '}
                        <button onClick={onGuestClick} className="font-medium text-indigo-400 hover:text-indigo-300">
                            Continue as a guest
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <ForgotPasswordModal
            isOpen={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
        />
        </>
    );
};

interface SignUpFormProps {
    onSignUp: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'> & {password: string}) => Promise<void>;
    onCreateProfileForExistingUser: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'>) => Promise<void>;
    onUserRegistered: (user: User) => void;
    onBack: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUp, onCreateProfileForExistingUser, onUserRegistered, onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        year: '1st Year',
        branch: 'CSE',
        mobile: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<any>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        // Validate form data
        if (!formData.name || !formData.email || !formData.password || !formData.rollNumber || !formData.mobile) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        // College email validation
        const collegeEmailRegex = /^[a-z0-9._%+-]+@gcet\.edu\.in$/i;
        if (!collegeEmailRegex.test(formData.email)) {
            setError('Only GCET college email addresses are allowed.');
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Generate OTP and store user data
            const result = await otpApiService.generateOTP(formData.email, formData);
            
            if (result.success) {
                // Store pending user data and show OTP verification modal
                setPendingUserData(formData);
                setVerificationSent(true);
                setShowOTPVerification(true);
                setIsSubmitting(false);
            } else {
                throw new Error(result.message || 'Failed to generate OTP');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please sign in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError(err.message || 'Failed to create account. Please try again.');
            }
            setIsSubmitting(false);
        }
    }

    const handleOTPVerificationSuccess = async (verificationData: any) => {
        if (pendingUserData) {
            try {
                // Create Firebase user account and log them in
                const { email, password, ...userData } = pendingUserData;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create user profile with all the provided details
                const userProfile = await userProfileService.createUserProfile(user, {
                    name: userData.name,
                    email: user.email || '',
                    role: 'student',
                    ...userData
                });

                if (userProfile) {
                    // User is now logged in and profile is created
                    setShowOTPVerification(false);
                    // Notify parent component that user is registered and logged in
                    onUserRegistered(userProfile);
                } else {
                    throw new Error("Could not create user profile.");
                }
            } catch (err: any) {
                console.error('Registration error:', err);
                if (err.code === 'auth/email-already-in-use') {
                    setError('An account with this email already exists. Please sign in instead.');
                } else if (err.code === 'auth/weak-password') {
                    setError('Password is too weak. Please choose a stronger password.');
                } else if (err.code === 'auth/invalid-email') {
                    setError('Please enter a valid email address.');
                } else {
                    setError(err.message || "Failed to create account.");
                }
                setShowOTPVerification(false);
            }
        }
    }

    return (
        <>
        <div className="w-full max-w-md animate-flip-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tighter">Create Student Account</h1>
                <p className="text-gray-400 mt-2">Join the campus hub and get started.</p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-300">Roll Number</label>
                            <input type="text" name="rollNumber" id="rollNumber" value={formData.rollNumber} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                    </div>
                     <PasswordField
                        label="Password"
                        id="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-300">Year</label>
                            <select name="year" id="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md">
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="branch" className="block text-sm font-medium text-gray-300">Branch</label>
                            <select name="branch" id="branch" value={formData.branch} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md">
                                <option>CSE</option>
                                <option>ECE</option>
                                <option>ME</option>
                                <option>IT</option>
                                <option>ARCH</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-300">Mobile Number</label>
                        <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                    <button type="button" onClick={onBack} className="w-full flex justify-center py-2 px-4 text-sm text-gray-400 hover:text-white">Back to Login</button>
                </form>
            </div>
        </div>

        <OTPVerificationModal
            isOpen={showOTPVerification}
            onClose={() => setShowOTPVerification(false)}
            email={formData.email}
            onVerificationSuccess={handleOTPVerificationSuccess}
            mode="email-verification"
            password={formData.password}
        />
        </>
    );
};

interface GuestFormProps {
    onGuestLogin: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'rollNumber' | 'managedClubIds'>) => void;
    onBack: () => void;
}

const GuestForm: React.FC<GuestFormProps> = ({ onGuestLogin, onBack }) => {
     const [formData, setFormData] = useState({
        name: '',
        email: '',
        collegeName: '',
        year: '1st Year',
        mobile: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGuestLogin(formData);
    }
    return (
       <div className="w-full max-w-md animate-flip-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tighter">Continue as Guest</h1>
                <p className="text-gray-400 mt-2">Your information will only be used for this session.</p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="collegeName" className="block text-sm font-medium text-gray-300">College Name</label>
                        <input type="text" name="collegeName" id="collegeName" value={formData.collegeName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-300">Year</label>
                            <select name="year" id="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md">
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-300">Mobile Number</label>
                            <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
                        </div>
                    </div>
                    <button type="submit" className="w-full flex justify-center py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">Proceed as Guest</button>
                    <button type="button" onClick={onBack} className="w-full flex justify-center py-2 px-4 text-sm text-gray-400 hover:text-white">Back to Login</button>
                </form>
            </div>
        </div>
    );
};

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegisterAndLogin: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'> & {password: string}) => Promise<void>;
    onCreateProfileForExistingUser: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'>) => Promise<void>;
    onUserRegistered: (user: User) => void;
    onGuestLogin: (details: Omit<User, 'id' | 'role' | 'isGuest' | 'rollNumber' | 'managedClubIds'>) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegisterAndLogin, onCreateProfileForExistingUser, onUserRegistered, onGuestLogin }) => {
    const [view, setView] = useState<View>('login');

    const renderContent = () => {
        switch (view) {
            case 'login':
                return <LoginForm 
                            onLogin={onLogin} 
                            onGuestClick={() => setView('guest')} 
                            onSignUpClick={() => setView('signup')}
                        />
            case 'signup':
                return <SignUpForm
                            onSignUp={onRegisterAndLogin}
                            onCreateProfileForExistingUser={onCreateProfileForExistingUser}
                            onUserRegistered={onUserRegistered}
                            onBack={() => setView('login')}
                       />
            case 'guest':
                return <GuestForm 
                        onGuestLogin={onGuestLogin}
                        onBack={() => setView('login')}
                    />
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-[#10141D] flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{perspective: '1200px'}}>
            {/* Background blobs */}
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-soft-light filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-soft-light filter blur-2xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-soft-light filter blur-2xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>

            <div className="relative z-10 w-full max-w-md">
                 {renderContent()}
            </div>
        </div>
    );
};

export default LoginPage;
