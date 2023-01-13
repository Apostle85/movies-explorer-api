const jwt = require('jsonwebtoken');
const IncorrectProfileError = require('../errors/IncorrectProfileError');
const {
  UNAUTHORIZED_USER_ERROR,
  INCORRECT_TOKEN_ERROR,
} = require('../constants/errorMessages');

module.exports = (req, res, next) => {
  const { NODE_ENV, JWT_SECRET } = process.env;
  const token = req.cookies.jwt;
  if (!token) return next(new IncorrectProfileError(UNAUTHORIZED_USER_ERROR));
  let payload;
  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key');
  } catch (err) {
    return next(new IncorrectProfileError(INCORRECT_TOKEN_ERROR));
  }
  req.user = payload; // записываем пейлоуд в объект запроса
  return next(); // пропускаем запрос дальше
};
