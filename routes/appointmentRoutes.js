import express from 'express';
import {
    bookAppointment,
    initiateAppointmentPayment,
    confirmAppointment,
    getUserAppointments,
    cancelAppointment, submitFeedback
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🟢 Book Appointment & Generate Payment Link
router.post('/book', protect, bookAppointment);

// 🟡 Initiate Payment for Existing Appointment
router.post('/initiate-payment', protect, initiateAppointmentPayment);

// ✅ Confirm Appointment After Payment
router.post('/confirm', protect, confirmAppointment);

// 🔍 Get User's Appointments
router.get('/', protect, getUserAppointments);

// ❌ Cancel Appointment
router.delete('/cancel/:appointmentId', protect, cancelAppointment);


// 📝 Submit Feedback
router.post('/feedback', protect, submitFeedback);

export default router;
