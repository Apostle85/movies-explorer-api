const Movie = require('../models/movie');

const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
const NotEnoughRightsError = require('../errors/NotEnoughRightsError');

module.exports.getMovies = (req, res, next) => {
  Movie.find({ owner: req.user._id })
    .then((movies) => res.send({ data: movies }))
    .catch(next);
};

module.exports.createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
  } = req.body;

  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
    owner: req.user._id,
  })
    .then((movie) => res.send({ data: movie }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(
          new IncorrectDataError(
            'Введены некорректные данные для создания карточки',
          ),
        );
      }
      next(err);
    });
};

module.exports.deleteMovie = (req, res, next) => {
  const { movieId } = req.params;

  Movie.findOne({ movieId })
    .then((movie) => {
      if (!movie) throw new NotFoundError('Запрашиваемая карточка не найдена');
      if (req.user._id !== movie.owner.toString()) {
        throw new NotEnoughRightsError('Недостаточно прав для удаления карточки');
      }

      return Movie.deleteOne({ movieId });
    })
    .then((newMovie) => {
      if (newMovie.deletedCount === 0) {
        throw new NotFoundError('Запрашиваемая карточка не найдена');
      }

      return res.send({ data: newMovie });
    })
    .catch((err) => {
      if (err.name === 'CastError') next(new IncorrectDataError('Введены некорректные данные для удаления карточки'));
      next(err);
    });
};
