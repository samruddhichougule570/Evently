// This code is used for ONE shared definition of "past event".
// Events are saved as a date (midnight), so an event taking place TODAY must stay open for the whole day.
const DAY_MS = 24 * 60 * 60 * 1000;

const isPastEvent = (eventDate) => new Date(eventDate).getTime() + DAY_MS <= Date.now();

module.exports = { isPastEvent, DAY_MS };
