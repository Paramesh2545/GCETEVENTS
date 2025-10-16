import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '../types';

interface NotificationsPanelProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

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
}

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
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        onClose();
    };
    
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="absolute right-0 mt-2 w-80 origin-top-right bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-slate-700 focus:outline-none animate-slide-down-fade flex flex-col max-h-[70vh]">
            <div className="p-3 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                        Mark all as read
                    </button>
                )}
            </div>
            
            <div className="overflow-y-auto flex-1">
                {sortedNotifications.length > 0 ? (
                    sortedNotifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full text-left p-3 hover:bg-slate-700/80 transition-colors border-b border-slate-700/50 last:border-b-0"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <NotificationIcon type={notification.type} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-300">{notification.message}</p>
                                    <p className={`mt-1 text-xs font-bold ${notification.isRead ? 'text-gray-500' : 'text-indigo-400'}`}>
                                        {formatDistanceToNow(notification.timestamp)}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full block"></span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-400">You have no new notifications.</p>
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-slate-700 flex-shrink-0">
                <Link
                    to="/notifications"
                    onClick={onClose}
                    className="block w-full text-center py-2 text-xs font-bold text-gray-300 hover:bg-slate-700/80 rounded"
                >
                    View All Notifications
                </Link>
            </div>
        </div>
    );
};

export default NotificationsPanel;