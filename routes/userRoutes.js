import express from 'express';
import { registerUser, loginUser,getUserProfile
    ,updateUserProfile,changeUserPassword,}
     from '../controllers/userController.js';

import { protect ,  } from '../middleware/userMiddleware.js';

const router = express.Router();

// User Registration Route
router.post('/register', registerUser);

//User Login
router.post('/login', loginUser);

//get user profile
router.get('/profile', protect, getUserProfile);

//update user profile
router.put('/profile', protect , updateUserProfile);

//change user password
router.patch('/change-password',protect,changeUserPassword);






export default router;
