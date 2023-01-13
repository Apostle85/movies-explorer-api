const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
const ExistingEmailError = require('../errors/ExistingEmailError');
const IncorrectProfileError = require('../errors/IncorrectProfileError');

const {
  EMAIL_IS_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
  INCORRECT_CREATE_USER_DATA_ERROR,
  INCORRECT_UPDATE_USER_DATA_ERROR,
  INCORRECT_PROFILE_DATA_ERROR,
} = require('../constants/errorMessages');

const {
  AUTH_CORRECT_MESSAGE,
} = require('../constants/successMessages');

module.exports.getUser = (req, res, next) => {
  const { _id } = req.user;

  User.findOne({ _id })
    .then((user) => {
      if (!user) {
        throw new NotFoundError(USER_NOT_FOUND_ERROR);
      }
      return res.send({ data: { email: user.email, name: user.name } });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new IncorrectDataError(
            INCORRECT_CREATE_USER_DATA_ERROR,
          ),
        );
      }
      next(err);
    });
};

module.exports.updateUser = (req, res, next) => {
  const { email, name } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { email, name },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((newUser) => {
      if (!newUser) {
        throw new NotFoundError(USER_NOT_FOUND_ERROR);
      }
      return res.send({ data: { email: newUser.email, name: newUser.name } });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new IncorrectDataError(
            INCORRECT_UPDATE_USER_DATA_ERROR,
          ),
        );
      }
      if (err.name === 'ValidationError') {
        next(
          new IncorrectDataError(
            INCORRECT_UPDATE_USER_DATA_ERROR,
          ),
        );
      }
      next(err);
    });
};

module.exports.signUp = (req, res, next) => {
  const {
    email,
    password,
    name,
  } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      email,
      password: hash,
      name,
    }))
    .then((user) => res.send({
      data: {
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        email: user.email,
      },
    }))
    .catch((err) => {
      if (err.code === 11000) next(new ExistingEmailError(EMAIL_IS_ALREADY_EXISTS_ERROR));
      if (err.name === 'ValidationError') next(new IncorrectDataError(INCORRECT_CREATE_USER_DATA_ERROR));
      next(err);
    });
};

module.exports.signIn = (req, res, next) => {
  const { email, password } = req.body;
  User
    // .findUserByCredentials(req.body.email, req.body.password)
    .findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        throw new IncorrectProfileError(INCORRECT_PROFILE_DATA_ERROR);
      }

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new IncorrectProfileError(INCORRECT_PROFILE_DATA_ERROR);
          }

          return user;
        });
    })
    .then((user) => {
      const { NODE_ENV, JWT_SECRET } = process.env;
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key', { expiresIn: '7d' });
      res
        .cookie('jwt', token, {
          maxAge: 3600000,
          httpOnly: true,
          sameSite: true,
          domain: NODE_ENV === 'production' ? 'eliproject.students.nomoredomains.rocks' : 'localhost',
        });
      return res.send({ data: AUTH_CORRECT_MESSAGE });
    })
    .catch(next);
};
