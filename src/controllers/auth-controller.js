import { customErrors, handleSuccessResponse } from '../utils/index.js';
import { authService } from '../services/index.js';
import { STATUS_CODES } from '../common/index.js';


const authController = {};
const { BadRequestError } = customErrors;

authController.login = async (req, res, next) => {
  try {

    if (!req?.body?.username && !req?.body?.email)
      throw new BadRequestError('Please provide both username/email and password.');

    const { email, username, password } = req.body;

    const { user, accessToken } = await authService.login({ email, username, password });


    return handleSuccessResponse({ res, data: { user, accessToken }, message: 'Welcome back! You have logged in successfully.' });


  } catch (error) {

    next(error);
  }
};



authController.register = async (req, res, next) => {
  try {
    throw new BadRequestError('New user registration is currently disabled.');

    validateReqBody(req.body);

    await authService.register(req.body);

    return handleSuccessResponse({ res, message: 'Registration successful! You can now log in.', statusCode: STATUS_CODES.CREATED });

  } catch (error) {

    next(error);
  }
};


function validateReqBody(reqBody) {
  const missingFields = [];

  if (!reqBody || Object.keys(reqBody ?? {}).length === 0)
    throw new BadRequestError('Registration details are missing.');

  if (!reqBody?.username)
    missingFields.push('username');
  if (!reqBody?.email)
    missingFields.push('email');

  if (!reqBody?.password)
    missingFields.push('password');


  if (missingFields.length) {
    const errorMsg = 'Please fill in the following required fields: ' + missingFields.join(', ');
    throw new BadRequestError(errorMsg);
  }
}


authController.getUserProfile = async (req, res, next) => {
  try {

    const userId = req.user._id;

    const user = await authService.getUserProfile(userId);


    return handleSuccessResponse({ res, data: { user } });

  } catch (error) {

    next(error);

  }
};


authController.updateUserProfile = async (req, res, next) => {
  try {

  } catch (error) {


  }
};


authController.changePassword = async (req, res, next) => {
  try {

    const { currentPassword, newPassword } = req?.body ?? {};

    if (!currentPassword)
      throw new BadRequestError('Please provide your current password.');


    if (!newPassword)
      throw new BadRequestError('Please provide a new password.');

    const userId = req.user._id;

    await authService.changePassword(userId, currentPassword, newPassword);

    return handleSuccessResponse({ res, message: 'Your password has been updated successfully.' });

  } catch (error) {

    next(error);

  }
};

export default authController;