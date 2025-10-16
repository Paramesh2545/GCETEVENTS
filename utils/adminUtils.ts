import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../frontend/firebaseConfig';
import { userProfileService } from '../services/firebaseAuthService';
import { ClubTeamMember, Club } from '../types';
import { removeUndefinedValues } from '../utils/firestoreUtils';

/**
 * Set a user's role to admin
 * @param userId - The user's UID
 * @param adminEmail - Email of the person making the change (for security)
 */
export const setUserAsAdmin = async (userId: string, adminEmail?: string): Promise<boolean> => {
  try {
    // Get the user's current profile
    const userProfile = await userProfileService.getUserProfile(userId);
    
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Update the user's role to admin
    await userProfileService.updateUserProfile(userId, {
      role: 'admin'
    });

    console.log(`User ${userProfile.name} (${userProfile.email}) has been set as admin`);
    return true;
  } catch (error) {
    console.error('Error setting user as admin:', error);
    return false;
  }
};

/**
 * Set a user's role to admin by email
 * @param email - The user's email
 * @param adminEmail - Email of the person making the change (for security)
 */
export const setUserAsAdminByEmail = async (email: string, adminEmail?: string): Promise<boolean> => {
  try {
    // First, we need to find the user by email
    // This requires a query, but for now we'll use a simple approach
    // In a real app, you might want to create an email-to-UID mapping
    
    // For now, we'll assume you have the UID
    // You can get this from Firebase Console or by searching
    throw new Error('Please use setUserAsAdmin with the user UID instead');
  } catch (error) {
    console.error('Error setting user as admin by email:', error);
    return false;
  }
};

/**
 * Get all users (for admin management)
 * Note: This requires proper Firestore queries
 */
export const getAllUsers = async (): Promise<any[]> => {
  try {
    // This would require a proper Firestore query
    // For now, return empty array
    console.log('getAllUsers requires proper Firestore implementation');
    return [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

/**
 * Check if a user is admin
 * @param userId - The user's UID
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userProfile = await userProfileService.getUserProfile(userId);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Assign contributor role to a user for specific clubs
 * @param userId - The user's UID
 * @param clubIds - Array of club IDs to assign
 * @param adminUserId - ID of the admin making the change
 */
export const assignContributorRole = async (userId: string, clubIds: string[], adminUserId: string): Promise<boolean> => {
  try {
    const userProfile = await userProfileService.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Update the user's role to contributor and set managed club IDs
    await userProfileService.updateUserProfile(userId, {
      role: 'contributor',
      managedClubIds: clubIds
    });

    console.log(`User ${userProfile.name} has been assigned contributor role for clubs: ${clubIds.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error assigning contributor role:', error);
    return false;
  }
};

/**
 * Revoke contributor access from a specific club
 * @param userId - The user's UID
 * @param clubId - The club ID to revoke access from
 * @param adminUserId - ID of the admin/contributor making the change
 */
export const revokeContributorFromClub = async (userId: string, clubId: string, adminUserId: string): Promise<boolean> => {
  try {
    const userProfile = await userProfileService.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Remove the club from managedClubIds
    const updatedClubIds = userProfile.managedClubIds?.filter(id => id !== clubId) || [];
    
    // If no clubs left, change role back to student
    const newRole = updatedClubIds.length === 0 ? 'student' : 'contributor';
    
    await userProfileService.updateUserProfile(userId, {
      role: newRole,
      managedClubIds: updatedClubIds
    });

    console.log(`User ${userProfile.name} has been revoked from club: ${clubId}`);
    return true;
  } catch (error) {
    console.error('Error revoking contributor from club:', error);
    return false;
  }
};

/**
 * Revoke all contributor access from a user
 * @param userId - The user's UID
 * @param adminUserId - ID of the admin making the change
 */
export const revokeAllContributorAccess = async (userId: string, adminUserId: string): Promise<boolean> => {
  try {
    const userProfile = await userProfileService.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Change role back to student and clear managed club IDs
    await userProfileService.updateUserProfile(userId, {
      role: 'student',
      managedClubIds: []
    });

    console.log(`User ${userProfile.name} has been revoked from all contributor roles`);
    return true;
  } catch (error) {
    console.error('Error revoking all contributor access:', error);
    return false;
  }
};

/**
 * Check if a user can manage a specific club
 * @param userId - The user's UID
 * @param clubId - The club ID to check
 */
export const canUserManageClub = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    const userProfile = await userProfileService.getUserProfile(userId);
    if (!userProfile) {
      return false;
    }

    // Admin can manage all clubs
    if (userProfile.role === 'admin') {
      return true;
    }

    // Contributor can manage their assigned clubs
    if (userProfile.role === 'contributor') {
      return userProfile.managedClubIds?.includes(clubId) || false;
    }

    return false;
  } catch (error) {
    console.error('Error checking club management permission:', error);
    return false;
  }
};

/**
 * Add a member to a club
 * @param clubId - The club ID
 * @param memberData - Member data to add
 * @param adminUserId - ID of the user making the change
 */
export const addClubMember = async (clubId: string, memberData: { name: string; position: string; imageUrl?: string }, adminUserId: string): Promise<boolean> => {
  try {
    // Check if user has permission to manage this club
    const hasPermission = await canUserManageClub(adminUserId, clubId);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to manage this club');
    }

    const clubRef = doc(db, 'clubs', clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      // If club doesn't exist in Firebase, it means data hasn't been migrated yet
      console.warn(`Club ${clubId} not found in Firebase. Data may not be migrated yet.`);
      throw new Error('Club not found in database. Please migrate data first using the Data Migration tool.');
    }

    const clubData = clubDoc.data();
    const newMember: ClubTeamMember = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: memberData.name,
      position: memberData.position,
      imageUrl: memberData.imageUrl || undefined
    };

    // Clean member object to avoid undefined/null/empty string fields
    const cleanedMember = removeUndefinedValues(newMember);
    Object.keys(cleanedMember).forEach(key => {
      if (typeof cleanedMember[key] === 'string' && cleanedMember[key].trim() === '') {
        delete cleanedMember[key];
      }
    });

    const updatedTeam = [...(clubData.team || []), cleanedMember];

    await updateDoc(clubRef, {
      team: updatedTeam
    });

    console.log(`Member ${memberData.name} added to club ${clubId}`);
    return true;
  } catch (error) {
    console.error('Error adding club member:', error);
    throw error;
  }
};

/**
 * Remove a member from a club
 * @param clubId - The club ID
 * @param memberId - The member ID to remove
 * @param adminUserId - ID of the user making the change
 */
export const removeClubMember = async (clubId: string, memberId: string, adminUserId: string): Promise<boolean> => {
  try {
    // Check if user has permission to manage this club
    const hasPermission = await canUserManageClub(adminUserId, clubId);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to manage this club');
    }

    const clubRef = doc(db, 'clubs', clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      // If club doesn't exist in Firebase, it means data hasn't been migrated yet
      console.warn(`Club ${clubId} not found in Firebase. Data may not be migrated yet.`);
      throw new Error('Club not found in database. Please migrate data first using the Data Migration tool.');
    }

    const clubData = clubDoc.data();
    // Clean each member in updatedTeam
    const updatedTeam = (clubData.team || [])
      .filter((member: ClubTeamMember) => member.id !== memberId)
      .map((member: ClubTeamMember) => {
        const cleaned = removeUndefinedValues(member);
        Object.keys(cleaned).forEach(key => {
          if (typeof cleaned[key] === 'string' && cleaned[key].trim() === '') {
            delete cleaned[key];
          }
        });
        return cleaned;
      });

    await updateDoc(clubRef, {
      team: updatedTeam
    });

    console.log(`Member ${memberId} removed from club ${clubId}`);
    return true;
  } catch (error) {
    console.error('Error removing club member:', error);
    throw error;
  }
};

/**
 * Update a club member's details
 * @param clubId - The club ID
 * @param memberId - The member ID to update
 * @param memberData - Updated member data
 * @param adminUserId - ID of the user making the change
 */
export const updateClubMember = async (clubId: string, memberId: string, memberData: { name?: string; position?: string; imageUrl?: string }, adminUserId: string): Promise<boolean> => {
  try {
    // Check if user has permission to manage this club
    const hasPermission = await canUserManageClub(adminUserId, clubId);
    // console.log(hasPermission, adminUserId, clubId);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to manage this club');
    }

    const clubRef = doc(db, 'clubs', clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      // If club doesn't exist in Firebase, it means data hasn't been migrated yet
      console.warn(`Club ${clubId} not found in Firebase. Data may not be migrated yet.`);
      throw new Error('Club not found in database. Please migrate data first using the Data Migration tool.');
    }

    const clubData = clubDoc.data();
    const updatedTeam = (clubData.team || []).map((member: ClubTeamMember) => {
      if (member.id === memberId) {
        const updatedMember = {
          ...member,
          ...memberData,
          imageUrl: memberData.imageUrl !== undefined ? memberData.imageUrl : member.imageUrl
        };
        // Clean updated member
        const cleaned = removeUndefinedValues(updatedMember);
        Object.keys(cleaned).forEach(key => {
          if (typeof cleaned[key] === 'string' && cleaned[key].trim() === '') {
            delete cleaned[key];
          }
        });
        return cleaned;
      }
      // Clean other members too
      const cleaned = removeUndefinedValues(member);
      Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'string' && cleaned[key].trim() === '') {
          delete cleaned[key];
        }
      });
      return cleaned;
    });

    await updateDoc(clubRef, {
      team: updatedTeam
    });

    console.log(`Member ${memberId} updated in club ${clubId}`);
    return true;
  } catch (error) {
    console.error('Error updating club member:', error);
    throw error;
  }
};

/**
 * Create a new club and assign an initial admin (as contributor for that club)
 * @param newClubData - Basic club data (name, tagline)
 * @param assignedAdminId - User ID to be assigned as the club's initial manager
 * @param requesterId - The user performing the action (must be admin)
 */
export const createClub = async (
  newClubData: {
    name: string;
    tagline: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    achievements?: string[];
    team?: ClubTeamMember[];
    recruitmentOpen?: boolean;
    recruitmentQuestions?: string[];
  },
  assignedAdminId: string,
  requesterId: string
): Promise<Club> => {
  // Only admins can create clubs
  const requester = await userProfileService.getUserProfile(requesterId);
  if (!requester || requester.role !== 'admin') {
    throw new Error('Only admins can create clubs');
  }

  // Create the club document
  const defaultClub: Omit<Club, 'id'> = {
    name: newClubData.name,
    tagline: newClubData.tagline,
    description: newClubData.description ?? '',
    logoUrl: newClubData.logoUrl ?? 'https://placehold.co/128x128?text=Club',
    bannerUrl: newClubData.bannerUrl ?? 'https://placehold.co/1200x300?text=Club+Banner',
    eventIds: [],
    achievements: newClubData.achievements ?? [],
    team: newClubData.team ?? [],
    recruitmentOpen: newClubData.recruitmentOpen,
    recruitmentQuestions: newClubData.recruitmentQuestions
  } as any;

  const clubRef = await addDoc(collection(db, 'clubs'), defaultClub);
  const createdClub: Club = { id: clubRef.id, ...defaultClub };

  // Assign the initial admin as contributor for this club (append to managedClubIds)
  const targetUser = await userProfileService.getUserProfile(assignedAdminId);
  if (!targetUser) {
    throw new Error('Assigned user not found');
  }

  const updatedManagedClubIds = Array.from(new Set([...(targetUser.managedClubIds || []), createdClub.id]));
  await userProfileService.updateUserProfile(assignedAdminId, {
    role: targetUser.role === 'admin' ? 'admin' : 'contributor',
    managedClubIds: updatedManagedClubIds
  });

  return createdClub;
};
