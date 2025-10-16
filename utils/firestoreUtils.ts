// Utility functions for Firestore data handling

/**
 * Removes undefined values from an object before saving to Firestore
 * Firestore doesn't allow undefined values, so we filter them out
 */
export const removeUndefinedValues = (obj: any): any => {
  const cleaned: any = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively clean nested objects
        const cleanedNested = removeUndefinedValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

/**
 * Converts undefined values to null for Firestore compatibility
 * Sometimes it's better to store null instead of omitting fields
 */
export const convertUndefinedToNull = (obj: any): any => {
  const converted: any = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === undefined) {
      converted[key] = null;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      converted[key] = convertUndefinedToNull(value);
    } else {
      converted[key] = value;
    }
  });
  
  return converted;
};

/**
 * Validates required fields for user profile
 */
export const validateUserProfile = (profile: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!profile.name || profile.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!profile.email || profile.email.trim() === '') {
    errors.push('Email is required');
  }
  
  if (!profile.role || !['admin', 'contributor', 'student', 'guest'].includes(profile.role)) {
    errors.push('Valid role is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
