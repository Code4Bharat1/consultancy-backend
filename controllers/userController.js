import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer'

// @desc Register new user
// @route POST /api/auth/register
// @access Public
// @desc Login user
// @route POST /api/auth/login
// @access Public




// Email Validation Regex
const emailRegex = /^(?!\.)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;

// Mobile Number Regex
const mobileRegex = /^\d{10}$/;

// Password Validation Regex
const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{6,}$/;

// ✅ Register User
export const registerUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;

    try {
        // 🔴 Validate Input
        if (!name || !email || !mobile || !password ) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // 🔴 Email Validation
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format!" });
        }

        // 🔴 Mobile Number Validation
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ success: false, message: "Mobile number must be 10 digits only!" });
        }

        // 🔴 Password Validation
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ success: false, message: "Password must have at least 6 characters, 1 uppercase letter, and 1 special character!" });
        }


        // 🔴 Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists.' });
        }

        // ✅ Create new user
        const user = await User.create({ name, email, mobile, password });

        // ✅ Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: "strict"
        });

        // ✅ Send Confirmation Email
        sendConfirmationEmail(email, name);

        // ✅ Send Response
        res.status(201).json({
            success: true,
            message: 'User registered successfully. A confirmation email has been sent.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
            token,
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Failed to register user.' });
    }
};

// ✅ Send Email Function
const sendConfirmationEmail = (userEmail, userName) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: userEmail,
        subject: "Registration Successful",
        text: `Hello ${userName},\n\nYour registration was successful!\n\nThank you for joining us!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Email Send Error:", error);
        } else {
            console.log("Registration Email Sent:", info.response);
        }
    });
};



export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie("jwt", token , {
            httpOnly:true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "strict"
        })

        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Failed to log in.' });
    }
};



// 🟢 Get User Profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
};

// 🟡 Update User Profile
export const updateUserProfile = async (req, res) => {
    const { name, email } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};

// 🔒 Change User Password
export const changeUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully.',
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
};
