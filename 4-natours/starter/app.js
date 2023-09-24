/* eslint-disable node/no-unpublished-require */
const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Allows us to parse json object
app.use(express.json());

// Allows us to access documents in the file system
app.use(express.static(`${__dirname}/public`));

//Adds a requestTime to the request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routers - original route here, the router handles additional routes on it
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Adding a middleware here is only hit if not hit by other routers
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Sorry, that is not a valid API route: ${req.originalUrl}`,
  // });

  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
  );

  next(err);
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
