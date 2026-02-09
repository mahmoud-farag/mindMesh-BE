import jwt from 'jsonwebtoken';
import customErrors from '../../shared/utils/customErrors.js';


const {BadRequestError, InternalServerError, CustomError} = customErrors;

const generateToken = (data) => {
  try {

    if (!data) 
      throw new BadRequestError('No data to generate the Auth token');

    const jwtSecret = process.env.JWT_SECRET;
    const expiresIn = process.env?.EXPIRES_IN ?? '7d';

    if (!jwtSecret) 
      throw new BadRequestError('Missing important parameters while prepare the auth token');

    const token = jwt.sign(data, jwtSecret, {expiresIn: expiresIn});

    return token;

  } catch(error) {
    
    throw error;
      
  }
}

export default generateToken;