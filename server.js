import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import appointmentRoutes from './routes/appointmentRoutes.js';



dotenv.config();

connectDB();

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000", // Allow frontend origin
        credentials: true, // Allow cookies
    })
);

app.use(express.json())
app.use(cookieParser())

app.get("/", (req,res) => {
    res.send("API is running...")
});

app.use('/api/auth', authRoutes);

app.use('/api/appointments', appointmentRoutes)

const PORT =process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));