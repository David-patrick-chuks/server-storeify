
import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'
import logger from '../config/logger';

// Initialize DOMPurify with JSDOM for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Function to sanitize user inputs to prevent XSS attacks
 * @param {string} input - The input string to be sanitized
 * @returns {string} - The sanitized input
 */
export const sanitizeInput = (input: string): string => {

    return DOMPurify.sanitize(input);
};

const password = "<script>alert('XSS')</script>"

logger.info(sanitizeInput(password)); 

