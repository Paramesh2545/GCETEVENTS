import React, { useState } from 'react';
import { Event } from '../types';
import { uploadEventHighlightImage } from '../services/firebaseStorageService';

interface EditHighlightsModalProps {
  event: Event;
  onClose: () => void;
  onSave: (highlights: Event['highlights']) => void;
}

const MAX_IMAGES = 3;

const EditHighlightsModal: React.FC<EditHighlightsModalProps> = ({ event, onClose, onSave }) => {
  const [images, setImages] = useState<(string | File)[]>(event.highlights?.images || []);
  const [guests, setGuests] = useState<string[]>(event.highlights?.guests || []);
  const [winners, setWinners] = useState<{ position: string; name: string; details?: string }[]>(event.highlights?.winners || []);
  const [galleryDriveLink, setGalleryDriveLink] = useState<string>(event.highlights?.galleryDriveLink || '');
  const [isUploading, setIsUploading] = useState(false);

  // Allow multiple image selection, but max 3 images total
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (images.length + filesArr.length > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }
    setImages(prev => [...prev, ...filesArr]);
  };

  const handleRemoveImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleGuestChange = (index: number, value: string) => {
    setGuests(prev => prev.map((g, i) => (i === index ? value : g)));
  };
  const handleAddGuest = () => setGuests(prev => [...prev, '']);
  const handleRemoveGuest = (index: number) => setGuests(prev => prev.filter((_, i) => i !== index));

  const handleWinnerChange = (index: number, field: 'position' | 'name' | 'details', value: string) => {
    setWinners(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };
  const handleAddWinner = () => setWinners(prev => [...prev, { position: '', name: '', details: '' }]);
  const handleRemoveWinner = (index: number) => setWinners(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setIsUploading(true);
    // Upload any images that are Files and replace with URLs
    const uploadedImages = await Promise.all(
      images.map(async img => {
        if (img instanceof File) {
          try {
            return await uploadEventHighlightImage(img, event.organizerClubId, event.id);
          } catch (err) {
            alert('Failed to upload image. Please try again.');
            return null;
          }
        }
        return img;
      })
    );
    setIsUploading(false);

    const cleanedImages = uploadedImages.filter(
      img => img && /^https?:\/\/.+/i.test(img)
    );

    const cleanedWinners = winners
      .filter(w => w.position && w.name)
      .map(w => ({ position: w.position, name: w.name, details: w.details || "" }));

    const cleanedGuests = guests.filter(Boolean);

    const highlights: any = {
      images: cleanedImages,
      guests: cleanedGuests,
      winners: cleanedWinners,
    };

    if (galleryDriveLink && galleryDriveLink.trim()) {
      highlights.galleryDriveLink = galleryDriveLink.trim();
    }

    await onSave(highlights);
    onClose();
  };

  return (
    <div className="p-6 overflow-y-auto flex-1">
      <h2 className="text-2xl font-bold text-white mb-4">Edit Event Highlights</h2>
      {/* Images */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Gallery Images <span className="text-xs text-gray-400">(max {MAX_IMAGES})</span></h3>
        <div className="flex flex-wrap gap-4 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {img instanceof File ? (
                <img src={URL.createObjectURL(img)} alt={`Highlight ${i + 1}`} className="w-32 h-20 object-cover rounded" />
              ) : (
                <img src={img} alt={`Highlight ${i + 1}`} className="w-32 h-20 object-cover rounded" />
              )}
              <button
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                title="Remove"
                disabled={isUploading}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="block mt-2"
          disabled={isUploading || images.length >= MAX_IMAGES}
        />
        {isUploading && <div className="text-indigo-400 text-xs mt-2">Uploading images...</div>}
        {images.length >= MAX_IMAGES && (
          <div className="text-xs text-red-400 mt-1">Maximum {MAX_IMAGES} images allowed.</div>
        )}
      </div>
      {/* Guests */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Special Guests</h3>
        {guests.map((g, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={g}
              onChange={e => handleGuestChange(i, e.target.value)}
              placeholder="Guest Name"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              disabled={isUploading}
            />
            <button onClick={() => handleRemoveGuest(i)} className="px-2 py-1 bg-red-600 text-white rounded" disabled={isUploading}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddGuest} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" disabled={isUploading}>+ Add Guest</button>
      </div>
      {/* Winners */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Winners</h3>
        {winners.map((w, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={w.position}
              onChange={e => handleWinnerChange(i, 'position', e.target.value)}
              placeholder="Position"
              className="w-1/4 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              disabled={isUploading}
            />
            <input
              type="text"
              value={w.name}
              onChange={e => handleWinnerChange(i, 'name', e.target.value)}
              placeholder="Name"
              className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              disabled={isUploading}
            />
            <input
              type="text"
              value={w.details || ''}
              onChange={e => handleWinnerChange(i, 'details', e.target.value)}
              placeholder="Details"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
              disabled={isUploading}
            />
            <button onClick={() => handleRemoveWinner(i)} className="px-2 py-1 bg-red-600 text-white rounded" disabled={isUploading}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddWinner} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" disabled={isUploading}>+ Add Winner</button>
      </div>
      {/* Gallery Drive Link (optional) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Gallery Drive Link <span className="text-xs text-gray-400">(optional)</span></h3>
        <input
          type="text"
          value={galleryDriveLink}
          onChange={e => setGalleryDriveLink(e.target.value)}
          placeholder="Google Drive Gallery Link"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
          disabled={isUploading}
        />
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded" disabled={isUploading}>Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={isUploading}>Save Changes</button>
      </div>
    </div>
  );
};

export default EditHighlightsModal;