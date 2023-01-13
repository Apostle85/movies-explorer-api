const router = require('express').Router();

const userRouter = require('./users');
const movieRouter = require('./movies');
const { signUp, signIn } = require('../controllers/users');
const auth = require('../middlewares/auth');
const { validateSignIn, validateSignUp } = require('../middlewares/validations');
const NotFoundError = require('../errors/NotFoundError');
const { UNKNOWN_RESOURCE_ERROR } = require('../constants/errorMessages');
const { SIGNOUT_MESSAGE } = require('../constants/successMessages');

const { NODE_ENV } = process.env;

router.post('/signin', validateSignIn, signIn);
router.post('/signup', validateSignUp, signUp);

router.use(auth);

router.get('/signout', (req, res) => res.clearCookie('jwt', { domain: NODE_ENV === 'production' ? 'eliproject.students.nomoredomains.rocks' : 'localhost' }).send({ message: SIGNOUT_MESSAGE }));

router.use('/users', userRouter);
router.use('/movies', movieRouter);
router.use('/', (req, res, next) => next(new NotFoundError(UNKNOWN_RESOURCE_ERROR)));

module.exports = router;
