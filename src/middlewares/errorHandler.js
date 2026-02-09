
import multer from 'multer';
import { STATUS_CODES } from '../common/index.js';
import { customErrors } from '../utils/index.js';


const { BadRequestError, InternalServerError, CustomError } = customErrors;

const errorHandler = (error, req, res, next) => {
  console.log('Inside the global error handler');

  if (!error)
    return next();

  console.error('-----Global errorHandler------:\n', error);

  let customErr = error;
  

  if (!(error instanceof CustomError)) {

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {

        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'File is missing or has an invalid field name.' });

      }

      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }

    // if (error.code === 11000)
    //   return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'duplicated fields found in our db, review your data and make sure it is unique' });

    if (error.name === 'TokenExpiredError')
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Your session has expired. Please log in again.' });

    if (error.name === 'JsonWebTokenError')
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Invalid authentication token.' });

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'An internal server error occurred.' });
  }



  return res.status(customErr.code || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: customErr?.message ?? 'An error occurred. Please contact the support team.',
  });


}

export default errorHandler;

