// /backend/models/Subscriber.js

import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        // Basic check for email format
        match: [/.+@.+\..+/, 'Please enter a valid email address'] 
    },
    subscribedAt: { 
        type: Date, 
        default: Date.now 
    },
    // Flag to indicate if they want product updates (as requested)
    wantsProductUpdates: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;