const jwt = require('jsonwebtoken');
const IncorrectProfileError = require('../errors/IncorrectProfileError');

module.exports = (req, res, next) => {
  const { NODE_ENV, JWT_SECRET } = process.env;
  const token = req.cookies.jwt;
  if (!token) return next(new IncorrectProfileError('Необходима авторизация'));
  let payload;
  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key');
  } catch (err) {
    return next(new IncorrectProfileError('Передан неверный токен'));
  }
  req.user = payload; // записываем пейлоуд в объект запроса
  return next(); // пропускаем запрос дальше
};
