import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../frontend/firebaseConfig';

// Uploads an image file to Firebase Storage and returns the download URL
export async function uploadClubImage(file: File, clubId: string, type: 'logo' | 'banner'): Promise<string> {
    const storage = getStorage();
    const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `clubs/${clubId}/${type}.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

// Add this function if it does not exist
export async function uploadEventHighlightImage(
  file: File,
  organizerClubId: string,
  eventId: string
): Promise<string> {
  const storage = getStorage();
  const ext = file.name.split('.').pop() || 'jpg';
  // Store each image with a unique filename (timestamp + random) to avoid overwriting
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const storageRef = ref(
    storage,
    `events/${organizerClubId}/${eventId}/highlights/${uniqueId}.${ext}`
  );
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
