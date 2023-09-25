/* eslint-disable node/no-unsupported-features/es-syntax */
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const duplicateValue = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value: ${duplicateValue}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpireError = (err) =>
  new AppError('Token has expired. Please log in again!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 1) Log error
    console.error('Error!!!', err);

    // 2) Send general message
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'Something went wrong on our end!',
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production ') {
    let error = { ...err };

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError(err);

    sendErrorProd(error, res);
  }
};
