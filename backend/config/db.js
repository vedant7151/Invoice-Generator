import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.MONGO_URI ;
    try {
        await mongoose.connect(uri);
        console.log("DB CONNECTED");
    } catch (err) {
        console.error('DB connection error:', err.message || err);
        process.exit(1);
    }
};