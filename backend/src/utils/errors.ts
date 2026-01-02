// Base API Error class  - All custom errors extend this
 

export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; 

    Error.captureStackTrace(this, this.constructor);
  }
}

//400 bad request erro
export class BadRequestError extends APIError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

//401 unauthorized erro 
export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized - Please log in') {
    super(message, 401);
  }
}

//403 forbidden error -authenticated but not permission like accessing admin routes etc
export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden - You do not have permission') {
    super(message, 403);
  }
}

//404 not found error
export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

//409 conflict erro 
export class ConflictError extends APIError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

//422  validation failed error
export class ValidationError extends APIError {
  errors?: any[];

  constructor(message: string = 'Validation failed', errors?: any[]) {
    super(message, 422);
    this.errors = errors;
  }
}

//500 internal server erro 
export class InternalServerError extends APIError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}