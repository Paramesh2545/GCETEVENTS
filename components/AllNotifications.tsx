import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '../types';
import SectionHeader from './SectionHeader';

// Helper function to format date
const formatDistanceToNow = (isoDate: string): string => {
    const date = new Date(isoDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

// Helper component for icons
const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    const iconStyles = "w-6 h-6";
    switch (type) {
        case 'application-accepted':
        case 'event-winner':
        case 'access-granted':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconStyles} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'application-rejected':
        case 'access-revoked':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconStyles} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'info':
        default:
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconStyles} text-indigo-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
};

interface AllNotificationsProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
}

const AllNotifications: React.FC<AllNotificationsProps> = ({ notifications, onMarkAsRead }) => {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const navigate = useNavigate();

    const filteredNotifications = useMemo(() => {
        const sorted = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (filter === 'unread') {
            return sorted.filter(n => !n.isRead);
        }
        return sorted;
    }, [notifications, filter]);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
            <SectionHeader title="All Notifications" subtitle="View and manage all your past and present notifications." />
            
            <div className="flex justify-center mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-800 max-w-xs mx-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-slate-800'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${filter === 'unread' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-slate-800'}`}
                >
                    Unread
                </button>
            </div>

            <div className="space-y-3">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full text-left p-4 hover:bg-slate-800/80 transition-colors border border-slate-800 bg-slate-900 rounded-lg"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <NotificationIcon type={notification.type} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-md text-gray-300">{notification.message}</p>
                                    <p className={`mt-1 text-xs font-bold ${notification.isRead ? 'text-gray-500' : 'text-indigo-400'}`}>
                                        {formatDistanceToNow(notification.timestamp)}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="flex-shrink-0 mt-1 self-center">
                                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full block animate-pulse"></span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center bg-slate-900 p-8 rounded-lg">
                        <p className="text-gray-400">No {filter === 'unread' ? 'unread' : ''} notifications found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllNotifications;