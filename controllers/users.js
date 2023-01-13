const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
const ExistingEmailError = require('../errors/ExistingEmailError');
const IncorrectProfileError = require('../errors/IncorrectProfileError');

module.exports.getUser = (req, res, next) => {
  const { _id } = req.user;

  User.findOne({ _id })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Запрашиваемый пользователь не найден');
      }
      return res.send({ data: { email: user.email, name: user.name } });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new IncorrectDataError(
            'Введены некорректные данные для создания пользователя',
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
        throw new NotFoundError('Запрашиваемый пользователь не найден');
      }
      return res.send({ data: { email: newUser.email, name: newUser.name } });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new IncorrectDataError(
            'Введены некорректные данные для обновления пользователя',
          ),
        );
      }
      if (err.name === 'ValidationError') {
        next(
          new IncorrectDataError(
            'Введены некорректные данные для обновления пользователя',
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
      if (err.code === 11000) next(new ExistingEmailError('Почта уже занята'));
      if (err.name === 'ValidationError') next(new IncorrectDataError('Введены некорректные данные для создания пользователя'));
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
        throw new IncorrectProfileError('Неправильные почта или пароль');
      }

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new IncorrectProfileError('Неправильные почта или пароль');
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
      return res.send({ data: 'Авторизация прошла успешно!' });
    })
    .catch(next);
};
