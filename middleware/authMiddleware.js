import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// 🔒 Protect Routes (JWT Authentication)
export const protect = async (req, res, next) => {
    let token;

    // 1️⃣ Check for Authorization Header with Bearer Token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2️⃣ If No Token, Deny Access
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        // 3️⃣ Verify Token and Decode User ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Find User Based on Decoded Token (Excluding Password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // 5️⃣ Proceed to Next Middleware or Route
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

