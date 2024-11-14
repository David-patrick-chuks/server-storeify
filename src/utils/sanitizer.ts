import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
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
    // Validate and sanitize the input
    if (isMaliciousData(input)) {
        throw new Error('Malicious data detected');
    }

    return DOMPurify.sanitize(input);
};

/**
 * Function to check if the input is malicious data
 * @param {string} input - The input string to be checked
 * @returns {boolean} - True if the input is malicious, false otherwise
 */
const isMaliciousData = (input: string): boolean => {
    // Add your own logic to detect malicious data
    // For example, you can check for specific patterns, keywords, or IP addresses
    // Return true if the input is malicious, false otherwise
    // Replace the following condition with your own logic
    return input.includes('<script>');
};

const password = '<img src=x onerror=alert(1)//>';
const password2 = "Chukka Adaao768";

try {
    const sanitizedPassword = sanitizeInput(password);
    logger.info(sanitizedPassword);
} catch (error : any) {
    if (error.message === 'Malicious data detected') {
        logger.error('Malicious data detected. Operation stopped.');
        // Send a response with an appropriate error message
        // For example, you can use Express.js to send a response:
        // res.status(400).json({ error: 'Malicious data detected' });
    } else {
        logger.error(error.message);
    }
}

logger.info(sanitizeInput(password2));