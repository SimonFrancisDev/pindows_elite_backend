// /routes/userRoutes.js
import express from "express";
import { 
    registerUser, authUser, 
    verifyEmail,  forgotPassword, 
    resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword); 
router.post("/reset-password/:token", resetPassword); 

export default router;
