import STATUS_CODES from './statusCodes.js';

class CustomError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

class InternalServerError extends CustomError {
    constructor(message = 'Internal Server Error') {
        super(message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
}

class BadRequestError extends CustomError {
    constructor(message = 'Bad Request') {
        super(message, STATUS_CODES.BAD_REQUEST);
    }
}

class NotFoundError extends CustomError {
    constructor(message = 'Resource Not Found') {
        super(message, STATUS_CODES.NOT_FOUND);
    }
}

const customErrors = {
    CustomError,
    InternalServerError,
    BadRequestError,
    NotFoundError
};

export default customErrors;
