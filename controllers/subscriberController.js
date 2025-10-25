// /backend/controllers/subscriberController.js

import asyncHandler from 'express-async-handler';
import Subscriber from '../models/Subscriber.js';
import { sendEmail } from '../utils/sendEmail.js'; // ⬅️ ASSUME YOU HAVE THIS HELPER

// @desc    Add a new email to the subscription list
// @route   POST /api/subscribe
// @access  Public
export const addSubscriber = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
        res.status(400);
        throw new Error('Email is required for subscription.');
    }

    try {
        // Check if the email already exists
        const exists = await Subscriber.findOne({ email });

        if (exists) {
            res.status(409).json({ message: 'That email is already subscribed.' }); // 409 Conflict
            return;
        }

        // Create the new subscriber record
        const subscriber = await Subscriber.create({ 
            email, 
            wantsProductUpdates: true 
        });

        res.status(201).json({ 
            message: 'Subscription successful! Welcome to the club.', 
            subscriber: { id: subscriber._id, email: subscriber.email } 
        });

    } catch (error) {
        // Mongoose validation error (e.g., failed match or unique constraint)
        if (error.code === 11000) { // MongoDB duplicate key error code
            res.status(409).json({ message: 'That email is already subscribed.' });
        } else {
            res.status(500).json({ message: 'Internal Server Error during subscription.' });
        }
    }
});



// /backend/controllers/subscriberController.js (Add this new function)


// @desc    Send an email update to all subscribers
// @route   POST /api/subscribers/send-update
// @access  Private/Admin
export const sendUpdateEmail = asyncHandler(async (req, res) => {
    const { subject, body, imageUrl } = req.body;
    
    // 1. Fetch all subscribers who want updates
    const subscribers = await Subscriber.find({ wantsProductUpdates: true });

    if (subscribers.length === 0) {
        res.status(404).json({ message: 'No subscribers found to send email to.' });
        return;
    }

    // 2. Extract emails
    const emailList = subscribers.map(sub => sub.email).join(',');

    // 3. Prepare Email Content (Using HTML template for a newsletter feel)
    const htmlBody = `
        <html>
        <head>
            <style>
                body { font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .header { color: #b8860b; font-size: 24px; margin-bottom: 20px; }
                .content { line-height: 1.6; color: #333; }
                .image { max-width: 100%; height: auto; margin-bottom: 20px; border-radius: 4px; }
                .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Pindows Elite Update</div>
                ${imageUrl ? `<img src="${imageUrl}" alt="Update Image" class="image" />` : ''}
                <div class="content">
                    ${body.replace(/\n/g, '<br>')}
                </div>
                <div class="footer">
                    <p>You received this email because you subscribed for product updates.</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // 4. Send the email (You need to implement the sendEmail utility)
    try {
        // NEW: Pass arguments in order (matches sendEmail signature)
        await sendEmail(emailList, subject, htmlBody);
        
        res.status(200).json({ 
            message: 'Email campaign sent successfully.',
            sentCount: subscribers.length
        });

    } catch (error) {
        console.error("Mass email failure:", error);
        res.status(500);
        throw new Error('Failed to send mass email. Check server logs.');
    }
});