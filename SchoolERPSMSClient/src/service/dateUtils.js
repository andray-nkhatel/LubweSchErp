/**
 * Date utility functions for Zambia timezone (Africa/Lusaka, UTC+2)
 */

const ZAMBIA_TIMEZONE = 'Africa/Lusaka';

/**
 * Format a date string to Zambia local time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateTime(dateString, options = {}) {
    if (!dateString) return '-';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ZAMBIA_TIMEZONE,
        ...options
    };
    
    return new Intl.DateTimeFormat('en-ZM', defaultOptions).format(date);
}

/**
 * Format a date only (no time) to Zambia local time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
    if (!dateString) return '-';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: ZAMBIA_TIMEZONE,
        ...options
    };
    
    return new Intl.DateTimeFormat('en-ZM', defaultOptions).format(date);
}

/**
 * Format a time only to Zambia local time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatTime(dateString, options = {}) {
    if (!dateString) return '-';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid time';
    
    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: ZAMBIA_TIMEZONE,
        ...options
    };
    
    return new Intl.DateTimeFormat('en-ZM', defaultOptions).format(date);
}

/**
 * Get current date/time in Zambia timezone
 * @returns {Date} Date object representing current time in Zambia
 */
export function getZambiaTime() {
    const now = new Date();
    const zambiaTimeString = now.toLocaleString('en-US', { timeZone: ZAMBIA_TIMEZONE });
    return new Date(zambiaTimeString);
}

/**
 * Convert UTC date to Zambia local time
 * @param {string|Date} dateString - UTC date string or Date object
 * @returns {Date} Date object in Zambia timezone
 */
export function toZambiaTime(dateString) {
    if (!dateString) return null;
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return null;
    
    // Get the timezone offset for Zambia (UTC+2)
    const zambiaOffset = 2 * 60; // 2 hours in minutes
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const zambiaTime = new Date(utcTime + (zambiaOffset * 60000));
    
    return zambiaTime;
}

/**
 * Format date for API (YYYY-MM-DD)
 * @param {string|Date} date - Date string or Date object
 * @returns {string|null} Formatted date string or null
 */
export function formatDateForApi(date) {
    if (!date) return null;
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return null;
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for API:', error, date);
        return null;
    }
}

