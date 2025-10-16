import { Event } from '../frontend/types';

/**
 * Safely gets the event name, handling both 'name' and 'title' fields
 * @param event - The event object
 * @returns The event name or a fallback
 */
export const getEventName = (event: Event): string => {
  return event.name || event.title || 'Untitled Event';
};

/**
 * Safely gets the event description
 * @param event - The event object
 * @returns The event description or a fallback
 */
export const getEventDescription = (event: Event): string => {
  return event.description || 'No description available';
};

/**
 * Safely gets the event date
 * @param event - The event object
 * @returns The event date or a fallback
 */
export const getEventDate = (event: Event): string => {
  return event.date || 'TBD';
};

/**
 * Safely gets the event time
 * @param event - The event object
 * @returns The event time or a fallback
 */
export const getEventTime = (event: Event): string => {
  return event.time || 'TBD';
};

/**
 * Safely gets the event location
 * @param event - The event object
 * @returns The event location or a fallback
 */
export const getEventLocation = (event: Event): string => {
  return event.location || 'TBD';
};

/**
 * Safely gets the event image URL
 * @param event - The event object
 * @returns The event image URL or a fallback
 */
export const getEventImageUrl = (event: Event): string => {
  return event.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image';
};

/**
 * Safely gets the event category
 * @param event - The event object
 * @returns The event category or a fallback
 */
export const getEventCategory = (event: Event): string => {
  return event.category || 'General';
};

/**
 * Safely gets the event status
 * @param event - The event object
 * @returns The event status or a fallback
 */
export const getEventStatus = (event: Event): string => {
  return event.status || 'Upcoming';
};

/**
 * Validates if an event has all required fields
 * @param event - The event object
 * @returns True if the event is valid, false otherwise
 */
export const isValidEvent = (event: Event): boolean => {
  return !!(
    event.id &&
    (event.name || event.title) &&
    event.date &&
    event.time &&
    event.location &&
    event.description
  );
};

/**
 * Normalizes an event object to ensure all fields are present
 * @param event - The event object
 * @returns A normalized event object with fallbacks
 */
export const normalizeEvent = (event: Event): Event => {
  return {
    ...event,
    name: getEventName(event),
    description: getEventDescription(event),
    date: getEventDate(event),
    time: getEventTime(event),
    location: getEventLocation(event),
    imageUrl: getEventImageUrl(event),
    category: getEventCategory(event) as any,
    status: getEventStatus(event) as any,
  };
};
