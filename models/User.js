// /models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define user schema with Mongoose
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    // 🟢 NEW FIELD: phoneNumber
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true, // Assuming phone numbers should be unique
        trim: true,
        // Optional: Add regex for validation, e.g., for 10-15 digits
        match: [/^\+?\d{10,15}$/, 'Please provide a valid phone number'], 
    },
    // 🟢 END NEW FIELD

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Exclude password from query results by default
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
      // 🔹 New fields for verification
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// 🧠 Optional: Automatically update `lastLogin` timestamp
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

// 🧩 Create & export model
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;