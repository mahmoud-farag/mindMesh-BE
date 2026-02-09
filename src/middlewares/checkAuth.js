import jwt from 'jsonwebtoken';
import { User } from '@mindmesh/shared-models';
import { STATUS_CODES } from '../common/index.js';

const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 2. Check if header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'The user associated with this token no longer exists.'
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error('Auth Error:', error.message);

    next(error);

  }
};

export default checkAuth;