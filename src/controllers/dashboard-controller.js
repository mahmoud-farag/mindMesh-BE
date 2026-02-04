
import { dashboardService } from '../services/index.js';

import { customErrors, handleSuccessResponse } from '../utils/index.js';

const { BadRequestError } = customErrors;


const dashboardController = {};

dashboardController.getDashboardData = async (req, res, next) => {
  try {


    const params = {
      userId: req.user._id,
    };

    const result = await dashboardService.getDashboardData(params);

    return handleSuccessResponse({ res, data: result, message: 'Dashboard statistics loaded successfully.' });

  } catch (error) {

    next(error);

  }
}


export default dashboardController