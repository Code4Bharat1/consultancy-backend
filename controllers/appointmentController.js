import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import nodemailer from 'nodemailer';

const MAX_APPOINTMENTS = 5; // Max number of appointments a user can book

// 🟢 Book an Appointment with Max Limit Constraint
export const bookAppointment = async (req, res) => {
    console.log("Incoming Appointment Request:", req.body); // Debugging

    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const { type, date, time, name, mobile } = req.body;
    const user = req.user.id;

    // Updated validation (no 'reason')
    if (!type || !date || !time || !name || !mobile) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields (type, date, time, name, mobile) are required.' 
        });
    }

    try {
        const existingAppointments = await Appointment.countDocuments({
            user,
            status: { $in: ["pending", "confirmed"] }
        });

        if (existingAppointments >= MAX_APPOINTMENTS) {
            return res.status(400).json({
                success: false,
                message: "You have reached the maximum number of appointments allowed.",
            });
        }

        const appointment = await Appointment.create({
            user,
            type,
            date,
            time,
            name,
            mobile,
            status: 'pending',
            paymentStatus: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully. Please proceed with payment.',
            appointment
        });
    } catch (error) {
        console.error('Book Appointment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to book appointment.' });
    }
};



// 🟡 Initiate Payment (Generate Payment Link)
export const initiateAppointmentPayment = async (req, res) => {
    const { appointmentId } = req.body;

    if (!appointmentId) {
        return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
    }

    try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.paymentStatus === 'completed') {
            return res.status(400).json({ success: false, message: 'Payment already completed.' });
        }

        // Simulated Payment Link (Replace with actual gateway)
        const paymentLink = `https://payment-gateway.com/pay?appointmentId=${appointmentId}&amount=1000`;

        res.status(200).json({
            success: true,
            message: 'Payment link generated successfully.',
            paymentLink,
            appointment
        });
    } catch (error) {
        console.error('Payment Link Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate payment link.' });
    }
};

// ✅ Confirm Appointment & Send Confirmation Email (Without Real Payment ID Constraint)
export const confirmAppointment = async (req, res) => {
    const { appointmentId, paymentId } = req.body;

    if (!appointmentId) {
        return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
    }

    try {
        const appointment = await Appointment.findById(appointmentId).populate("user", "email name");

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        // Accept any payment ID and confirm the appointment
        appointment.paymentStatus = 'completed';  // Mark as completed
        appointment.paymentId = paymentId || "dummy-payment-id"; // Use dummy payment ID if not provided
        appointment.status = 'confirmed'; // Update appointment status

        await appointment.save();

        // Send Confirmation Email using the user's email
        sendConfirmationEmail(appointment.user.email, appointment);

        res.status(200).json({
            success: true,
            message: 'Appointment confirmed successfully.',
            appointment
        });
    } catch (error) {
        console.error('Confirm Appointment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm appointment.' });
    }
};

// 🔹 Function to Send Confirmation Email
const sendConfirmationEmail = (userEmail, appointment) => {
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
        subject: 'Appointment Confirmation',
        text: `Hello, your appointment is confirmed!\n\nDetails:\n- Type: ${appointment.type}\n- Date: ${appointment.date}\n- Time: ${appointment.time}\n\nThank you!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email Send Error:', error);
        } else {
            console.log('Confirmation Email Sent:', info.response);
        }
    });
};

// ❌ Cancel Appointment (Only if Payment is Pending)
export const cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.paymentStatus === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel a completed appointment.' });
        }

        // Update status to cancelled
        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment cancelled successfully.' });
    } catch (error) {
        console.error('Cancel Appointment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
    }
};

// 📝 Submit Feedback After Completed Appointment
export const submitFeedback = async (req, res) => {
    const { appointmentId, feedback } = req.body;

    if (!appointmentId || !feedback) {
        return res.status(400).json({ success: false, message: 'Appointment ID and feedback are required.' });
    }

    try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Feedback can only be submitted for completed appointments.' });
        }

        // Save feedback
        appointment.feedback = feedback;
        await appointment.save();

        res.status(200).json({ success: true, message: 'Feedback submitted successfully.', appointment });
    } catch (error) {
        console.error('Feedback Submission Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
    }
};

// Get Appointments for the Authenticated User
export const getUserAppointments = async (req, res) => {
    try {
        // Use req.user (if set by auth middleware) or fallback to req.body.user
        const userId = req.user ? req.user.id : req.body.user;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const appointments = await Appointment.find({ user: userId }).sort({ date: 1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get Appointments Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
    }
};
