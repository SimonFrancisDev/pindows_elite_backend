// /controllers/authController.js

import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

/**
 * @desc Register a new user + send verification email
 * @route POST /api/users/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    // 🟢 MODIFIED: Add phoneNumber to destructuring
    const { name, email, phoneNumber, password } = req.body;

    // Check for existing user by email (or phoneNumber, if desired, but keeping existing logic)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("User already exists");
    }

    // Create user
    const user = await User.create({
        name,
        email,
        phoneNumber, // 🟢 ADDED: Pass phoneNumber to the User model
        password,
        isVerified: false,
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // ✅ FIX: Ensure user.email exists before sending
    if (!user.email) {
        console.error("❌ User email is missing, cannot send verification email");
        throw new Error("User email is missing");
    }

    console.log("📧 Sending verification email to:", user.email);
    console.log("🔗 Verification URL:", verifyUrl);

    await sendEmail(
        user.email,
        "Verify Your Email",
        `
        <div style="background-color:#000; color:#d4af37; font-family:'Segoe UI', Arial, sans-serif; padding:40px 20px; text-align:center; border-radius:12px; max-width:600px; margin:auto; border:1px solid #222;">
            <div style="margin-bottom:25px;">
                <img src="http://localhost:5000/logo.jpg" alt="Pindows Logo" style="width:90px; height:auto;" />
            </div>

            <h1 style="color:#d4af37; font-size:26px; margin-bottom:10px; letter-spacing:1px;">Welcome to Pindows</h1>
            <p style="color:#ccc; font-size:16px; line-height:1.6;">
                Thank you for joining us! Please verify your email address to activate your account.
            </p>

            <a href="${verifyUrl}" 
                style="display:inline-block; background-color:#d4af37; color:#000; text-decoration:none; padding:14px 30px; border-radius:6px; margin-top:25px; font-weight:bold; letter-spacing:0.5px;">
                Verify My Email
            </a>

            <p style="color:#999; font-size:14px; margin-top:30px;">
                This link will expire in <strong>1 hour</strong>.<br/>
                If you did not create an account with us, please ignore this email.
            </p>

            <hr style="margin:35px 0; border:0; border-top:1px solid #333;">
            <footer style="color:#555; font-size:13px;">
                © ${new Date().getFullYear()} Pindows Elite. All rights reserved.
            </footer>
        </div>
        `
    );

    res.status(201).json({
        success: true,
        message: "Registration successful! Please check your email to verify your account.",
    });
});

/**
 * @desc Verify email
 * @route GET /api/users/verify/:token
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new Error("Invalid or expired verification link."); 
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully! You can now log in." }); 
});

/**
 * @desc Login user (only if verified)
 * @route POST /api/users/login
 * @access Public
 */
export const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // We must retrieve the password field for matchPassword, 
    // which requires .select('+password') because it is set to 'select: false' in the model.
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            res.status(403); 
            throw new Error("Please verify your email before logging in.");
        }

        // 🛑 FIX: Use a nullish coalescing operator (??) to ensure the role is NEVER undefined.
        // If user.role is null or undefined, it defaults to 'user'.
        const roleForToken = user.role ?? 'user';

        // 💡 DEBUGGING: Log the role value before generating the token
        console.log(`User found: ${user.name}. Role determined for token: ${roleForToken}`);

        res.json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: roleForToken, // Use the non-undefined role
            },
            // The argument passed here MUST NOT be undefined.
            token: generateToken(user._id, roleForToken), 
        });
    } else {
        throw new Error("Invalid email or password");
    }
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("No user found with that email");
    }

    const resetToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // ✅ FIX: Ensure user.email exists before sending
    if (!user.email) {
        console.error("❌ User email is missing, cannot send reset password email");
        throw new Error("User email is missing");
    }

    console.log("📧 Sending password reset email to:", user.email);
    console.log("🔗 Password reset URL:", resetUrl);

    try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await sendEmail(
            user.email,
            "Reset Your Password - Pindows Elite",
            `
            <div style="background-color:#000; color:#d4af37; font-family:'Segoe UI', Arial, sans-serif; padding:40px 20px; text-align:center; border-radius:12px; max-width:600px; margin:auto; border:1px solid #222;">
                <div style="margin-bottom:25px;">
                    <img src="http://localhost:5000/logo.jpg" alt="Pindows Logo" style="width:90px; height:auto;" />
                </div>

                <h1 style="color:#d4af37; font-size:26px; margin-bottom:10px; letter-spacing:1px;">Reset Your Password</h1>
                <p style="color:#ccc; font-size:16px; line-height:1.6;">
                    Hello <strong>${user.name}</strong>,<br/>
                    We received a request to reset your password for your Pindows Elite account.
                </p>

                <a href="${resetUrl}" 
                    style="display:inline-block; background-color:#d4af37; color:#000; text-decoration:none; padding:14px 30px; border-radius:6px; margin-top:25px; font-weight:bold; letter-spacing:0.5px;">
                    Reset Password
                </a>

                <p style="color:#999; font-size:14px; margin-top:30px;">
                    This link will expire in <strong>15 minutes</strong>.<br/>
                    If you didn’t request this password reset, please ignore this email.
                </p>

                <hr style="margin:35px 0; border:0; border-top:1px solid #333;">
                <footer style="color:#555; font-size:13px;">
                    © ${new Date().getFullYear()} Pindows Elite. All rights reserved.
                </footer>
            </div>
            `
        );

        res.status(200).json({ success: true, message: "Reset link sent to your email" });
    } catch (err) {
        console.error("❌ Failed to send password reset email:", err);
        throw new Error("Error sending email. Please try again later.");
    }
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        user.password = password;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (err) {
        console.error("❌ Password reset error:", err);
        throw new Error("Invalid or expired token");
    }
});