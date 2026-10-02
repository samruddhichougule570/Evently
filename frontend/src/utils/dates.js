// This code is used for ONE shared definition of "past event" (same rule as backend/utils/dates.js).
// Events are stored as a date, so an event taking place TODAY stays open for the whole day.
const DAY_MS = 24 * 60 * 60 * 1000;

export const isPastEvent = (eventDate) => new Date(eventDate).getTime() + DAY_MS <= Date.now();
