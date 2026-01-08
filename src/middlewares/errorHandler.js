
import multer from 'multer';
import { STATUS_CODES } from '../common/index.js';
import { customErrors } from '../utils/index.js';


const { BadRequestError, InternalServerError, CustomError } = customErrors;

const errorHandler = (error, req, res, next) => {
  console.log('Inside the globale error handler');

  if (!error)
    return next();

  console.error('-----Global errorHandler------:\n', error);

  let customErr = error;

  if (!(error instanceof CustomError)) {

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'File missing or invalid field name' });
      
      } 

      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
    }

    // if (error.code === 11000)
    //   return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'duplicated fields found in our db, review your data and make sure it is unique' });

    if (error.name === 'TokenExpiredError')
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Token has expired. Please login again.' });

    if (error.name === 'JsonWebTokenError')
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Invalid token.' });


    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
  }



  return res.status(customErr.code || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: customErr?.message ?? 'Error happen, please contact the supporting team',
  });


}

export default errorHandler;

