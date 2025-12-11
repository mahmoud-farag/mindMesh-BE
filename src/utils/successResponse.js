import { STATUS_CODES } from '../common/index.js';

/**
 * Standardized success response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} data - Data to send in response
 * @param {string} message - Success message
 */
const handleSuccessResponse = ({ res, data, message = 'Success', statusCode = STATUS_CODES.OK }) => {

    const response = { success: true, message };

    if (data) 
        response.data = data;
    
    return res.status(statusCode).json(response);
};

export default handleSuccessResponse;
