import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { eventRegistrationService, EventRegistration, RegistrationStats } from '../services/eventRegistrationService';
import * as XLSX from 'xlsx';

interface EventRegistrationStatsProps {
  event: Event;
  isManager: boolean;
}

const EventRegistrationStats: React.FC<EventRegistrationStatsProps> = ({ event, isManager }) => {
  const [stats, setStats] = useState<RegistrationStats>({
    totalRegistrations: 0,
    confirmedRegistrations: 0,
    pendingRegistrations: 0,
    cancelledRegistrations: 0,
    checkedInCount: 0
  });
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isManager) {
      loadRegistrationData();
    }
  }, [event.id, isManager]);

  const loadRegistrationData = async () => {
    try {
      setIsLoading(true);
      // Already uses correct params:
      const [statsData, registrationsData] = await Promise.all([
        eventRegistrationService.getEventRegistrationStats(event.id, event.organizerClubId),
        eventRegistrationService.getEventRegistrations(event.id, event.organizerClubId)
      ]);
      setStats(statsData);
      setRegistrations(registrationsData);
      
    } catch (error) {
      console.error('Error loading registration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    try {
      // await eventRegistrationService.checkInUser(registrationId);
      // await loadRegistrationData(); // Refresh data
    } catch (error) {
      console.error('Error checking in user:', error);
    }
  };

  const handleDownloadRegistrations = async (eventId: string, eventName: string) => {
      // Fetch registrations for this event
      // You may need to pass club.id if not available in event
      const clubId = event.organizerClubId;
      try {
        const registrations = await import('../services/eventRegistrationService')
          .then(mod => mod.eventRegistrationService.getEventRegistrations(eventId, clubId));
        if (!registrations || registrations.length === 0) {
          alert('No registrations found for this event.');
          return;
        }
        // Prepare data for Excel
        const data = registrations.map(reg => ({
          Name: reg.userName,
          Email: reg.userEmail,
          Phone: reg.userPhone || '',
          RollNumber: reg.userRollNumber || '',
          Branch: reg.userBranch || '',
          Year: reg.userYear || '',
          RegistrationDate: reg.registrationDate?.seconds
            ? new Date(reg.registrationDate.seconds * 1000).toLocaleString()
            : '',
          Status: reg.status,
          PaymentStatus: reg.paymentStatus || '',
          CheckIn: reg.checkInStatus === 'checked_in' ? 'Yes' : 'No'
        }));
        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
        // Download as Excel file
        XLSX.writeFile(workbook, `${eventName.replace(/\s+/g, '_')}_registrations.xlsx`);
      } catch (error) {
        alert('Failed to download registrations.');
        console.error(error);
      }
    };

  if (!isManager) return null;

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-white">Registration Statistics</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

        {/* <div className="bg-gradient-to-br from-green-500/20 to-green-700/10 p-4 rounded-lg flex flex-col items-center justify-center shadow">
          <div className="text-3xl font-extrabold text-green-400">{stats.checkedInCount}</div>
          <div className="text-sm text-gray-400 mt-1">Checked In</div>
        </div> */}
      {/* Stats Cards - Only show total and checked-in */}
      <div className="grid grid-cols-2 gap-6 mb-6">
  {/* Total Registrations Card */}
  <div className="bg-gradient-to-br from-indigo-500/30 via-indigo-600/20 to-indigo-900/20 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300">
    <div className="flex items-center gap-2">
      <span className="text-4xl font-extrabold text-indigo-400">{stats.totalRegistrations}</span>
    </div>
    <div className="text-sm text-gray-300 mt-2 tracking-wide">Total Registrations</div>
  </div>

    {/* Download List Button */}
    <button
      onClick={() => handleDownloadRegistrations(event.id, event.name)}
      className="flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg bg-gradient-to-br from-green-500/30 via-green-600/20 to-green-900/20 hover:from-green-500 hover:to-green-700 transition-all duration-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 text-green-400 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
      </svg>
      <h1 className="text-sm font-semibold text-gray-200">Download List</h1>
    </button>
  </div>


      {/* Registration Details */}
      {showDetails && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Registration Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-gray-400">Name</th>
                  <th className="text-left py-2 text-gray-400">Email</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} className="border-b border-slate-800 hover:bg-slate-900/30 transition">
                    <td className="py-2 text-white">{registration.userName}</td>
                    <td className="py-2 text-gray-400">{registration.userEmail}</td>
                    {/* <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        registration.checkInStatus === 'checked_in' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {registration.checkInStatus === 'checked_in' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {registration.checkInStatus !== 'checked_in' && (
                          <button
                            onClick={() => handleCheckIn(registration.id!)}
                            className="text-blue-400 hover:text-blue-300 text-xs px-3 py-1 rounded bg-blue-500/10"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistrationStats;