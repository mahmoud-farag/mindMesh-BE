import { customErrors, handleSuccessResponse } from '../utils/index.js';
import { authService } from '../services/index.js';
import { STATUS_CODES } from '../common/index.js';


const authController = {};
const { BadRequestError } = customErrors;

authController.login = async (req, res, next) => {
  try {

    if (!req?.body?.username && !req?.body?.email)
      throw new BadRequestError('Missing credentials');

    const { email, username, password } = req.body;

    const { user, accessToken } = await authService.login({email, username, password});


    return handleSuccessResponse({ res, data: { user, accessToken }, message: 'You logged in successfully.' });


  } catch (error) {

    next(error);
  }
};



authController.register = async (req, res, next) => {
  try {

    validateReqBody(req.body);

    await authService.register(req.body);

    return handleSuccessResponse({ res, message: 'Registered successfully, now you can login', statusCode: STATUS_CODES.CREATED });

  } catch (error) {

    next(error);
  }
};


function validateReqBody(reqBody) {
  const missingFields = [];

  if (!reqBody || Object.keys(reqBody ?? {}).length === 0)
    throw new BadRequestError('You have to provide the registeration payload');

  if (!reqBody?.username)
    missingFields.push('username');
  if (!reqBody?.email)
    missingFields.push('email');

  if (!reqBody?.password)
    missingFields.push('password');


  if (missingFields.length) {
    const errorMsg = 'Please fill the missing fields to proceed, (' + missingFields.join(' ,') + ')';
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
      throw new BadRequestError('Current password is must be provied');


    if (!newPassword)
      throw new BadRequestError('New password is missing');

    const userId = req.user._id;

    await authService.changePassword(userId, currentPassword, newPassword);

    return handleSuccessResponse({ res, message: 'Password updated successfully' });

  } catch (error) {

    next(error);

  }
};

export default authController;