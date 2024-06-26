import jwt from 'jsonwebtoken';

import {Employee, ValidateLogin, ValidateRegister} from '../models/Employee.js';

const generateAccessAndRefreshTokens = async employeeId => {
  try {
    const employee = await Employee.findById(employeeId);

    const accessToken = employee.generateAccessToken();
    const refreshToken = employee.generateRefreshToken();

    // attach refresh token to employee document to avoid refreshing access token with multiple refresh tokens
    employee.refreshToken = refreshToken;
    await employee.save();

    return {accessToken, refreshToken};
  } catch (error) {
    res
      .status(500)
      .send('Something went wrong while generating the access token');
  }
};

const registerEmployee = async (req, res) => {
  const {error} = ValidateRegister(req.body);
  if (error) return res.status(400).send(error.issues[0].message);

  let employee = await Employee.findOne({email: req.body.email});
  if (employee)
    return res.status(409).send('Employee with email already exists');

  employee = new Employee({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
  });
  await employee.save();

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(
    employee._id,
  );

  const options = {
    httpOnly: true,
    sercure: process.env.NODE_ENV === 'production',
  };

  const {_id, name, email, role} = employee;
  return res
    .status(201)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json({employee: {_id, name, email, role}, accessToken, refreshToken});
};

const loginEmployee = async (req, res) => {
  const {error} = ValidateLogin(req.body);
  if (error) return res.status(400).send(error.issues[0].message);

  const employee = await Employee.findOne({email: req.body.email});
  if (!employee) return res.status(401).send('Email and password do not match');

  const isPasswordValid = await employee.isPasswordCorrect(req.body.password);
  if (!isPasswordValid)
    return res.status(401).send('Email and password do not match');

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(
    employee._id,
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  const {_id, name, email} = employee;

  return res
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json({employee: {_id, name, email}, accessToken, refreshToken});
};

const logoutEmployee = async (req, res) => {
  await Employee.findByIdAndUpdate(
    req.employee._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {new: true},
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json('Employee logged out');
};

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken)
    return res.status(401).json('Unauthorized request');

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  
    const employee = await Employee.findById(decodedToken?._id);
    if (!employee) return res.status(401).json('Invalid refresh token');
  
    if (incomingRefreshToken !== employee?.refreshToken) {
      // If token is valid but is used already
      return res.status(401).json('Refresh token is expired or used');
    }
  
    const {accessToken, refreshToken: newRefreshToken} =
      await generateAccessAndRefreshTokens(employee._id);
  
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
  
    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        {accessToken, refreshToken: newRefreshToken},
        'Access token refreshed',
      );
  } catch (error) {
    return res.status(401).json(error?.message || 'Invalid refresh token');
  }
};

const getEmployee = async (req, res) => {
  const employee = await Employee.findById(req.employee._id).select(
    '-__v -password -refreshToken',
  );

  return res.json(employee);
};

export {
  registerEmployee,
  loginEmployee,
  logoutEmployee,
  refreshAccessToken,
  getEmployee,
};
