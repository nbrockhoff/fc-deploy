const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(farmController.getFarms));
router.get('/farms', catchErrors(farmController.getFarms));
router.get('/farms/page/:page', catchErrors(farmController.getFarms));
router.get('/add', farmController.addFarm);

router.post('/add', 
	farmController.upload, 
	catchErrors(farmController.resize), 
	catchErrors(farmController.createFarm)
	);

router.post('/add/:id', 
	farmController.upload, 
	catchErrors(farmController.resize), 
	catchErrors(farmController.updateFarm)
	);

router.get('/farms/:id/edit', catchErrors(farmController.editFarm));
router.get('/farm/:farmSlug', catchErrors(farmController.getFarmBySlug));
router.get('/farmTags', catchErrors(farmController.getFarmsByTag));
router.get('/farmTags/:farmTag', catchErrors(farmController.getFarmsByTag));

router.get('/login', userController.loginForm);  
router.post('/login', authController.login);
router.get('/register', userController.registerForm);


router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);
router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get('/map', farmController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(farmController.getHearts));
router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(farmController.getTopFarms));
/*
  API
*/

router.get('/api/search', catchErrors(farmController.searchFarms));
router.get('/api/farms/near', catchErrors(farmController.mapFarms));
router.post('/api/farms/:id/heart', catchErrors(farmController.heartFarm));

module.exports = router;