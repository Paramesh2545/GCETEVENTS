import React, { useState, useEffect } from 'react';
import { User, Club } from '../types';
import { revokeContributorFromClub, revokeAllContributorAccess, canUserManageClub } from '../utils/adminUtils';

interface ContributorManagerProps {
  currentUser: User;
  club: Club;
  contributors: User[];
  onContributorUpdate: () => void;
}

const ContributorManager: React.FC<ContributorManagerProps> = ({
  currentUser,
  club,
  contributors,
  onContributorUpdate
}) => {
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Check if current user can manage this club
  useEffect(() => {
    const checkPermissions = async () => {
      if (currentUser?.id) {
        const hasPermission = await canUserManageClub(currentUser.id, club.id);
        setCanManage(hasPermission);
      }
    };
    checkPermissions();
  }, [currentUser, club.id]);

  // Filter contributors who manage this specific club
  const clubContributors = contributors.filter(contributor => 
    contributor.managedClubIds?.includes(club.id)
  );

  const handleRevokeFromClub = async (contributorId: string, contributorName: string) => {
    if (!currentUser?.id) return;

    setLoading(true);
    setMessage(null);

    try {
      const success = await revokeContributorFromClub(contributorId, club.id, currentUser.id);
      
      if (success) {
        setMessage({ text: `${contributorName} has been revoked from ${club.name}`, type: 'success' });
        onContributorUpdate();
      } else {
        setMessage({ text: 'Failed to revoke contributor access', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error revoking contributor access', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllAccess = async (contributorId: string, contributorName: string) => {
    if (!currentUser?.id) return;

    setLoading(true);
    setMessage(null);

    try {
      const success = await revokeAllContributorAccess(contributorId, currentUser.id);
      
      if (success) {
        setMessage({ text: `${contributorName} has been revoked from all clubs`, type: 'success' });
        onContributorUpdate();
      } else {
        setMessage({ text: 'Failed to revoke all contributor access', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error revoking all contributor access', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Club Contributors</h3>
        <span className="text-sm text-gray-400">{clubContributors.length} contributor(s)</span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {clubContributors.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="text-gray-400">No contributors assigned to this club</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clubContributors.map((contributor) => (
            <div key={contributor.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <span className="text-indigo-400 font-bold text-sm">
                    {contributor.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">{contributor.name}</p>
                  <p className="text-sm text-gray-400">{contributor.rollNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {contributor.managedClubIds?.length || 0} club(s)
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRevokeFromClub(contributor.id!, contributor.name)}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-orange-600/50 text-orange-300 hover:bg-orange-600/80 rounded-md disabled:opacity-50"
                  >
                    Revoke from {club.name}
                  </button>
                  
                  {contributor.managedClubIds && contributor.managedClubIds.length > 1 && (
                    <button
                      onClick={() => handleRevokeAllAccess(contributor.id!, contributor.name)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-red-600/50 text-red-300 hover:bg-red-600/80 rounded-md disabled:opacity-50"
                    >
                      Revoke All
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-800/30 rounded-md">
        <p className="text-xs text-gray-400">
          <strong>Note:</strong> As a contributor to this club, you can revoke other contributors' access to this club. 
          Admins can revoke access to any club.
        </p>
      </div>
    </div>
  );
};

export default ContributorManager;
