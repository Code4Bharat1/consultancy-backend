import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    type: {
        type: String,
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,  // e.g., "10:00 AM"
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },

    feedback: {
        type: String,
        enum: ["pending" , "confirmed" , "completed" , "cancelled"], default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Appointment Model
const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
