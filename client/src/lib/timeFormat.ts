/**
 * Converts a time string from 24-hour format to 12-hour format with AM/PM
 * @param time24 - Time string in HH:mm format (e.g., "14:30", "09:00")
 * @returns Time string in 12-hour format with AM/PM (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTime12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Converts a Date object to 12-hour format time string with AM/PM
 * @param date - Date object
 * @returns Time string in 12-hour format with AM/PM
 */
export function formatDateTime12Hour(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
