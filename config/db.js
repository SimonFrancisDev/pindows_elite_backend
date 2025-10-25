// /config/db.js
import mongoose from 'mongoose';
import colors from 'colors'; // Optional for colored logs

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `✅  MongoDB Connected: `
    );
  } catch (error) {
    console.error(
      `❌  Error connecting to MongoDB: `.red.bold + `${error.message}`.yellow
    );
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
