import React, { useState } from 'react';
import { Event, EventCategory, EventStatus } from '../types';
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../frontend/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestoreDataService } from '../services/firestoreDataService';
interface CreateEventProps {
  clubId: string;
  onClose: () => void;
  onCreateEvent?: (event: Event) => void;
  onUpdateEvent?: (event: Event) => void;
  eventToEdit?: Event;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }> = ({ label, id, children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            {children}
        </select>
    </div>
);


const CreateEventForm: React.FC<CreateEventProps> = ({ clubId, onClose, onCreateEvent, onUpdateEvent, eventToEdit }) => {
  const isEditMode = !!eventToEdit;
  const [isEditing, setIsEditing] = useState(false);
  const [markAsPast, setMarkAsPast] = useState(false);
  const [winnerDetails, setWinnerDetails] = useState('');
  const [eventImages, setEventImages] = useState<File[]>([]);
  
  const [name, setName] = useState(eventToEdit?.name || '');
  const [date, setDate] = useState(eventToEdit?.date || '');
  const [time, setTime] = useState(eventToEdit?.time || '');
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [rules, setRules] = useState(eventToEdit?.rules?.join('\n') || '');
  const [category, setCategory] = useState<EventCategory>(eventToEdit?.category || 'Technical');
  const [capacity, setCapacity] = useState(eventToEdit?.capacity?.toString() || '');
  const [specialGuests, setSpecialGuests] = useState(eventToEdit?.specialGuests?.join('\n') || '');
  const [feeType, setFeeType] = useState<'free' | 'paid'>(eventToEdit?.registrationFee && eventToEdit.registrationFee > 0 ? 'paid' : 'free');
  const [feeAmount, setFeeAmount] = useState(eventToEdit?.registrationFee?.toString() || '');
  const [customSections, setCustomSections] = useState(
    eventToEdit?.customSections || []
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [eventCompleted, setEventCompleted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState(eventToEdit?.whatsappLink || '');
  const [mediaHouseAssist, setMediaHouseAssist] = useState(eventToEdit?.mediaHouseAssist || false);

  // New: Team registration fields
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>(eventToEdit?.registrationType || 'individual');
  const [maxTeamSize, setMaxTeamSize] = useState(eventToEdit?.maxTeamSize?.toString() || '');

  const handleCustomSectionChange = (index: number, field: 'title' | 'content' | 'type', value: string) => {
    const newSections = [...customSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setCustomSections(newSections);
  };

  const handleCustomSectionFilesChange = (index: number, files: FileList | null) => {
    if (!files) return;
    const newSections = [...customSections];
    newSections[index] = {
      ...newSections[index],
      files: Array.from(files)
    };
    setCustomSections(newSections);
  };
  
  const addCustomSection = () => {
    setCustomSections([...customSections, { title: '', content: '' }]);
  };

  const removeCustomSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleEventImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setEventImages(filesArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    let imageUrl = eventToEdit?.imageUrl || '';
    if (imageFile) {
      setImageUploading(true);
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `eventImages/${clubId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("Image upload failed. Please try again.");
        setImageUploading(false);
        setFormSubmitting(false);
        return;
      }
      setImageUploading(false);
    }

    // Use existing ID for edit, new ID for create
    const eventId = isEditMode ? eventToEdit!.id : `ev${Date.now()}`;
    // --- Set status based on date ---
    let status: EventStatus = EventStatus.Upcoming;
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) status = EventStatus.Ongoing;

    const eventData = {
      id: eventId,
      name,
      date,
      time,
      location,
      description,
      rules: rules.split('\n').filter(r => r.trim() !== ''),
      category,
      registrationFee: feeType === 'paid' ? Number(feeAmount) : 0,
      capacity: capacity ? parseInt(capacity) : undefined,
      specialGuests: specialGuests.split('\n').filter(g => g.trim() !== ''),
      customSections: customSections.filter(s => s.title.trim() !== '' && s.content.trim() !== ''),
      imageUrl,
      status, // <-- status is set here
      whatsappLink,
      mediaHouseAssist,
      // New fields for team registration
      registrationType,
      ...(registrationType === 'team' && maxTeamSize ? { maxTeamSize: parseInt(maxTeamSize) } : {}),
    };

    if (isEditMode && onUpdateEvent) {
      const updatedEvent: Event = {
        ...eventToEdit,
        ...eventData
      };
      onUpdateEvent(updatedEvent);

      try {
        // Update existing event document
        const eventRef = doc(db, "events", clubId, "clubEvents", eventId);
        await setDoc(eventRef, {
          ...eventData,
          organizerClubId: clubId,
          createdAt: eventToEdit.createdAt || new Date().toISOString(),
        });
        console.log("Event updated:", { ...eventData, organizerClubId: clubId });
      } catch (err) {
        console.error("Error updating event:", err);
      }
      setFormSubmitting(false);
    } else if (onCreateEvent) {
      const newEvent: Event = {
        id: eventId,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        status: EventStatus.Upcoming,
        organizerClubId: clubId,
        coordinators: [],
        whatsappLink,
        mediaHouseAssist,
        ...eventData
      };
      onCreateEvent(newEvent);

      try {
        // Create new event document
        const eventRef = doc(db, "events", clubId, "clubEvents", eventId);
        await setDoc(eventRef, {
          ...eventData,
          organizerClubId: clubId,
          createdAt: new Date().toISOString(),
        });
        console.log("Event created:", { ...eventData, organizerClubId: clubId });
      } catch (err) {
        console.error("Error creating event:", err);
      }
      setFormSubmitting(false);
    }
  };

  const handleMarkEventCompleted = async () => {
    setFormSubmitting(true);
    try {
      // Update event status to 'Past' in backend
      await firestoreDataService.updateClubEvent(clubId, eventToEdit!.id, { status: EventStatus.Past });
      setEventCompleted(true);
      alert('Event marked as completed and moved to past events.');
      onClose();
    } catch (err) {
      console.log(err);
      alert('Failed to mark event as completed.');
    }
    setFormSubmitting(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Loading overlay */}
      {formSubmitting && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg text-white">Submitting event...</p>
          </div>
        </div>
      )}
      {/* Header (Fixed) */}
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Event Details' : 'Host a New Event'}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
      </div>

      {/* Scrollable Content (Form + Footer) */}
      <div className="overflow-y-auto flex-1">
           <form id="create-event-form" onSubmit={handleSubmit}>
              {/* Form Body with padding */}
              <div className="p-6 space-y-6">
                  <InputField label="Event Title" id="name" value={name} onChange={e => setName(e.target.value)} type="text" required />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Date" id="date" value={date} onChange={e => setDate(e.target.value)} type="date" required />
                      <InputField label="Time" id="time" value={time} onChange={e => setTime(e.target.value)} type="time" required />
                  </div>

                  <InputField label="Venue / Location" id="location" value={location} onChange={e => setLocation(e.target.value)} type="text" required placeholder="e.g., Main Auditorium or Virtual" />
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Event Banner (Image Upload)</label>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600" />
                      {imageUploading && <p className="text-indigo-400 mt-2">Uploading image...</p>}
                  </div>

                  <TextAreaField label="Description" id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SelectField label="Category" id="category" value={category} onChange={e => setCategory(e.target.value as EventCategory)} required>
                          <option value="Technical">Technical</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Sports">Sports</option>
                      </SelectField>
                      <InputField label="Event Capacity" id="capacity" value={capacity} onChange={e => setCapacity(e.target.value)} type="number" min="1" placeholder="e.g., 100" />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Registration Fee</label>
                      <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                              <input type="radio" name="feeType" value="free" checked={feeType === 'free'} onChange={() => setFeeType('free')} className="h-4 w-4 bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                              <span>Free</span>
                          </label>
                           <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                              <input type="radio" name="feeType" value="paid" checked={feeType === 'paid'} onChange={() => setFeeType('paid')} className="h-4 w-4 bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                              <span>Paid</span>
                          </label>
                      </div>
                  </div>

                  {feeType === 'paid' && (
                      <div className="animate-tab-content-enter">
                          <InputField label="Fee Amount ($)" id="registrationFee" type="number" min="0.01" step="0.01" placeholder="e.g., 10" required value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
                      </div>
                  )}

                  <TextAreaField label="Special Guests/Speakers (Optional)" id="specialGuests" value={specialGuests} onChange={e => setSpecialGuests(e.target.value)} rows={2} placeholder="Enter one guest per line." />
                  <TextAreaField label="Rules & Guidelines (Optional)" id="rules" value={rules} onChange={e => setRules(e.target.value)} rows={3} placeholder="Enter one rule per line." />
              
                  <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Custom Sections</h3>
                      <div className="space-y-4">
                        {customSections.map((section, index) => (
                          <div key={index} className="p-3 bg-slate-800/50 rounded-lg space-y-2 relative">
                            <button type="button" onClick={() => removeCustomSection(index)} className="absolute top-2 right-2 p-1 bg-red-600/20 text-red-400 hover:bg-red-600/50 rounded-full text-sm font-bold">&times;</button>
                            <InputField label="Section Title" id={`custom-title-${index}`} value={section.title} onChange={(e) => handleCustomSectionChange(index, 'title', e.target.value)} placeholder="e.g., Prizes" />
                            <SelectField
                              label="Section Type"
                              id={`custom-type-${index}`}
                              value={section.type || 'text'}
                              onChange={e => handleCustomSectionChange(index, 'type', e.target.value)}
                              required
                            >
                              <option value="text">Text</option>
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </SelectField>
                            {/* Content input for text type */}
                            {(!section.type || section.type === 'text') && (
                              <TextAreaField label="Section Content" id={`custom-content-${index}`} value={section.content || ''} onChange={e => handleCustomSectionChange(index, 'content', e.target.value)} rows={3} placeholder="Describe the section content..." />
                            )}
                            {/* File input for image/video type */}
                            {(section.type === 'image' || section.type === 'video') && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  {section.type === 'image' ? 'Upload Images' : 'Upload Videos'}
                                </label>
                                <input
                                  type="file"
                                  accept={section.type === 'image' ? 'image/*' : 'video/*'}
                                  multiple
                                  onChange={e => handleCustomSectionFilesChange(index, e.target.files)}
                                  className="block"
                                />
                                {/* Preview selected files */}
                                {section.files && section.files.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {section.files.map((file: File, i: number) => (
                                      <span key={i} className="text-xs text-gray-400 bg-slate-700 px-2 py-1 rounded">{file.name}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addCustomSection} className="mt-3 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md font-semibold">+ Add Custom Section</button>
                  </div>

                  {/* In your event edit form, add: */}
                  {isEditing && (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                        onClick={() => setMarkAsPast(true)}
                      >
                        Mark as Past Event
                      </button>
                      {markAsPast && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            placeholder="Winner Details"
                            value={winnerDetails}
                            onChange={e => setWinnerDetails(e.target.value)}
                            className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                          />
                          <input
                            type="file"
                            multiple
                            onChange={handleEventImagesUpload}
                            className="block"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <InputField
                      label="WhatsApp Group Link (for students to join)"
                      id="whatsappLink"
                      type="url"
                      value={whatsappLink}
                      onChange={e => setWhatsappLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      required={false}
                    />
                  </div>
                  <div className="flex items-center mt-4">
                    <label htmlFor="mediaHouseAssist" className="text-sm font-medium text-gray-300 mr-3">
                      Do you want any assist from media house for promotions?
                    </label>
                    <input
                      id="mediaHouseAssist"
                      type="checkbox"
                      checked={mediaHouseAssist}
                      onChange={e => setMediaHouseAssist(e.target.checked)}
                      className="h-5 w-5 text-indigo-600 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                  
                  {/* Registration Type (Individual/Team) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Registration Type</label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                          type="radio"
                          name="registrationType"
                          value="individual"
                          checked={registrationType === 'individual'}
                          onChange={() => setRegistrationType('individual')}
                          className="h-4 w-4 bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Individual</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                          type="radio"
                          name="registrationType"
                          value="team"
                          checked={registrationType === 'team'}
                          onChange={() => setRegistrationType('team')}
                          className="h-4 w-4 bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Team</span>
                      </label>
                    </div>
                  </div>
                  {/* Max Team Size (only if team registration) */}
                  {registrationType === 'team' && (
                    <div>
                      <InputField
                        label="Maximum Team Size"
                        id="maxTeamSize"
                        type="number"
                        min="2"
                        max="20"
                        required
                        value={maxTeamSize}
                        onChange={e => setMaxTeamSize(e.target.value)}
                        placeholder="e.g., 4"
                      />
                    </div>
                  )}
              </div>
            
              {/* Footer (part of scrollable content) */}
              <div className="p-6 border-t border-slate-700">
                   <div className="flex justify-end gap-4">
                      <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">Cancel</button>
                      <button type="submit" form="create-event-form" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Save Changes' : 'Create Event'}</button>
                      {/* Show "Mark as Completed" button only in edit mode and if event is not already past */}
                      {isEditMode && eventToEdit?.status !== EventStatus.Past && (
                        <button
                          type="button"
                          onClick={handleMarkEventCompleted}
                          className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                          disabled={formSubmitting}
                        >
                          Mark Event as Completed
                        </button>
                      )}
                   </div>
              </div>
          </form>
      </div>
    </div>
  );
};

export default CreateEventForm;