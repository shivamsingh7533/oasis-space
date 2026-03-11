import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaShieldAlt, FaTrash, FaDesktop, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import PushNotificationManager from '../components/PushNotificationManager';
import { 
    updateUserStart, updateUserSuccess, updateUserFailure, 
    deleteUserFailure, deleteUserStart, deleteUserSuccess,
    signOutUserStart 
} from '../redux/user/userSlice';
import { setTheme } from '../redux/theme/themeSlice';
import { setCurrency } from '../redux/currency/currencySlice';

export default function Settings() {
    const { currentUser, loading } = useSelector((state) => state.user);
    const { theme } = useSelector((state) => state.theme);
    const { currency } = useSelector((state) => state.currency);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // UI States
    const [activeTab, setActiveTab] = useState('notifications'); // Desktop default tab
    const [expandedTab, setExpandedTab] = useState('notifications'); // Mobile accordion expanded state

    // Security Form States
    const [password, setPassword] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [error, setError] = useState(null);

    const isGoogleUser = currentUser?.avatar?.includes('googleusercontent.com');

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (password.length < 6) return setError('Password must be at least 6 characters');
        
        try {
            dispatch(updateUserStart());
            setError(null);
            
            const res = await fetch(`/api/user/update/${currentUser._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            
            if (data.success === false) {
                setError(data.message);
                dispatch(updateUserFailure(data.message));
                return;
            }
            
            dispatch(updateUserSuccess(data));
            setUpdateSuccess(true);
            setPassword('');
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
            dispatch(updateUserFailure(err.message));
        }
    };

    const handleDeleteUser = async () => {
        if (!window.confirm("WARNING: This will permanently delete your account, properties, and order history. Are you sure?")) {
            return;
        }
        
        try {
            dispatch(deleteUserStart());
            const res = await fetch(`/api/user/delete/${currentUser._id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.success === false) {
                dispatch(deleteUserFailure(data.message));
                alert(data.message);
                return;
            }
            
            dispatch(deleteUserSuccess(data));
            navigate('/');
        } catch (error) {
            dispatch(deleteUserFailure(error.message));
        }
    };

    const toggleAccordion = (tabId) => {
        setExpandedTab(expandedTab === tabId ? null : tabId);
        setActiveTab(tabId);
    };

    // --- TAB CONFIGURATIONS ---
    const tabs = [
        {
            id: 'notifications',
            icon: <FaBell />,
            title: 'Notifications',
            subtitle: 'Manage alerts and push messages',
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Push Notifications</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Receive instant alerts on your device for important events like property bookings, message replies, and seller approvals.
                        </p>
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                            <PushNotificationManager />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'security',
            icon: <FaShieldAlt />,
            title: 'Security & Privacy',
            subtitle: 'Update password and account access',
            content: (
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Change Password</h3>
                        {isGoogleUser ? (
                            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 text-sm text-blue-300">
                                You are signed in using Google. Password changes are managed through your Google Account settings.
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-3 max-w-sm">
                                <input
                                    type='password'
                                    value={password}
                                    placeholder='New Password (min 6 chars)'
                                    className='bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500'
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    disabled={loading || password.length < 6}
                                    className='bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition disabled:opacity-50'
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                {error && <p className='text-red-400 text-xs mt-1'>{error}</p>}
                                {updateSuccess && <p className='text-green-400 text-xs mt-1'>Password updated successfully!</p>}
                            </form>
                        )}
                    </div>
                </div>
            )
        },
        {
            id: 'preferences',
            icon: <FaDesktop />,
            title: 'Preferences',
            subtitle: 'App appearance and region (Coming Soon)',
            content: (
                <div className="space-y-8">
                    {/* Theme Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Display Theme</h3>
                        <p className="text-sm text-slate-400 mb-4">Choose how OasisSpace looks to you.</p>
                        <div className="flex bg-slate-800 rounded-xl p-1 w-full max-w-sm border border-slate-700">
                            {['system', 'light', 'dark'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => dispatch(setTheme(mode))}
                                    className={`flex-1 capitalize py-2 rounded-lg text-sm font-bold transition ${
                                        theme === mode 
                                            ? 'bg-blue-600 text-white shadow' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-slate-700/50" />

                    {/* Currency Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Regional Currency</h3>
                        <p className="text-sm text-slate-400 mb-4">Select your preferred currency for viewing property prices.</p>
                        <select
                            value={currency}
                            onChange={(e) => dispatch(setCurrency(e.target.value))}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full max-w-xs p-3 appearance-none outline-none"
                        >
                            <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                            <option value="USD">USD ($) - US Dollar</option>
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="GBP">GBP (£) - British Pound</option>
                            <option value="AED">AED (د.إ) - UAE Dirham</option>
                            <option value="CAD">CAD ($) - Canadian Dollar</option>
                            <option value="AUD">AUD ($) - Australian Dollar</option>
                            <option value="JPY">JPY (¥) - Japanese Yen</option>
                            <option value="CNY">CNY (¥) - Chinese Yuan</option>
                            <option value="CHF">CHF (Fr) - Swiss Franc</option>
                            <option value="NZD">NZD ($) - New Zealand Dollar</option>
                            <option value="ZAR">ZAR (R) - South African Rand</option>
                            <option value="SGD">SGD ($) - Singapore Dollar</option>
                            <option value="RUB">RUB (₽) - Russian Ruble</option>
                            <option value="BRL">BRL (R$) - Brazilian Real</option>
                        </select>
                    </div>
                </div>
            )
        },
        {
            id: 'danger',
            icon: <FaTrash />,
            title: 'Danger Zone',
            subtitle: 'Permanently delete your account',
            headerClass: 'text-red-400',
            content: (
                <div className="space-y-6">
                    <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-red-500 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-300/80 mb-6 font-medium">
                            Once you delete your account, there is no going back. All your property listings, orders, and saved data will be permanently erased.
                        </p>
                        <button
                            onClick={handleDeleteUser}
                            className="bg-transparent border-2 border-red-500 hover:bg-red-500 text-red-500 hover:text-white font-bold py-2 px-6 rounded-lg transition"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>
            )
        }
    ];

    if (!currentUser) return null;

    return (
        <div className="min-h-[85vh] bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-extrabold text-white mb-2">Settings</h1>
                <p className="text-slate-400 mb-8">Manage your account preferences and configurations.</p>

                {/* --- DESKTOP LAYOUT (Sidebar + Content) --- */}
                <div className="hidden md:flex flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-1/3 max-w-[300px] flex flex-col gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-left p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${
                                    activeTab === tab.id 
                                        ? 'bg-blue-600/20 border-l-4 border-blue-500 text-white shadow-lg' 
                                        : 'bg-slate-800/40 hover:bg-slate-800 border-l-4 border-transparent text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`flex justify-center flex-shrink-0 w-6 h-6 text-xl transition-transform ${tab.headerClass || (activeTab === tab.id ? 'text-blue-400 scale-110' : 'text-slate-500')}`}>
                                        {tab.icon}
                                    </span>
                                    <div>
                                        <div className={`font-bold ${tab.headerClass || ''}`}>{tab.title}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{tab.subtitle}</div>
                                    </div>
                                </div>
                                <FaChevronRight className={`text-xs ${activeTab === tab.id ? 'text-blue-400 opacity-100' : 'opacity-0'}`} />
                            </button>
                        ))}
                    </div>

                    {/* Desktop Content Area */}
                    <div className="relative w-2/3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 shadow-xl min-h-[400px] overflow-hidden">
                        
                        {/* Huge Visual Watermark */}
                        <div className="absolute -bottom-12 -right-12 text-[260px] text-slate-800/30 z-0 pointer-events-none transform -rotate-12 select-none">
                            {tabs.find(t => t.id === activeTab)?.icon}
                        </div>
                        
                        {/* Foreground Content */}
                        <div className="relative z-10 h-full">
                            {tabs.find(t => t.id === activeTab)?.content}
                        </div>
                    </div>
                </div>


                {/* --- MOBILE LAYOUT (Accordion Stack) --- */}
                <div className="md:hidden flex flex-col gap-4">
                    {tabs.map((tab) => (
                        <div key={tab.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleAccordion(tab.id)}
                                className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-700/30 transition focus:outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full bg-slate-900/50 ${tab.headerClass || 'text-blue-400'}`}>
                                        {tab.icon}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-lg ${tab.headerClass || 'text-white'}`}>{tab.title}</div>
                                        <div className="text-xs text-slate-400 line-clamp-1">{tab.subtitle}</div>
                                    </div>
                                </div>
                                <div className={`transition-transform duration-300 ${expandedTab === tab.id ? 'rotate-180' : 'rotate-0'}`}>
                                    <FaChevronDown className="text-slate-500 text-sm" />
                                </div>
                            </button>

                            {/* Accordion Body */}
                            <div 
                                className={`transition-all duration-300 ease-in-out ${
                                    expandedTab === tab.id 
                                        ? 'max-h-[800px] opacity-100 border-t border-slate-700/50' 
                                        : 'max-h-0 opacity-0'
                                } overflow-hidden bg-slate-800/30`}
                            >
                                <div className="p-5">
                                    {tab.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
