import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, format } from 'date-fns';

const TIMEZONE = 'America/Bogota';

console.log('=== Testing Timezone Handling ===\n');

// Current time
const now = new Date();
console.log('Current UTC time:', now.toISOString());
console.log('Current local time (server):', now.toString());

// Convert to Bogota timezone
const nowInBogota = toZonedTime(now, TIMEZONE);
console.log('\nCurrent time in Bogota (toZonedTime):', nowInBogota.toString());
console.log('Current time in Bogota (ISO):', nowInBogota.toISOString());

// Get start and end of day in Bogota
const startOfDayBogota = startOfDay(nowInBogota);
const endOfDayBogota = endOfDay(nowInBogota);

console.log('\nStart of day (Bogota object):', startOfDayBogota.toString());
console.log('End of day (Bogota object):', endOfDayBogota.toString());

// Convert back to UTC using fromZonedTime
const startOfToday = fromZonedTime(startOfDayBogota, TIMEZONE);
const endOfToday = fromZonedTime(endOfDayBogota, TIMEZONE);

console.log('\nStart of today (UTC after fromZonedTime):', startOfToday.toISOString());
console.log('End of today (UTC after fromZonedTime):', endOfToday.toISOString());

// What we actually want for queries
console.log('\n=== What we should use for database queries ===');
console.log('Query should be: startDateTime >= ', startOfToday.toISOString());
console.log('Query should be: startDateTime <= ', endOfToday.toISOString());

// Alternative approach - simpler
console.log('\n=== Alternative Simpler Approach ===');
const nowInBogotaAlt = toZonedTime(now, TIMEZONE);
const dateInBogota = format(nowInBogotaAlt, 'yyyy-MM-dd');
console.log('Date in Bogota:', dateInBogota);

// Create start and end using the date string directly
const startOfDayUTC = new Date(`${dateInBogota}T00:00:00-05:00`);
const endOfDayUTC = new Date(`${dateInBogota}T23:59:59.999-05:00`);

console.log('Start of day UTC (simple):', startOfDayUTC.toISOString());
console.log('End of day UTC (simple):', endOfDayUTC.toISOString());
