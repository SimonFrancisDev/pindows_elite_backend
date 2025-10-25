// 🟢 NEW: EMAIL TEMPLATES UTILITY FILE

// Helper function to format currency (e.g., 370000 -> ₦370,000.00)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Generates the main HTML content for the order confirmation email
export const generateOrderConfirmationHtml = (order, recipientName) => {
    const orderItemsHtml = order.orderItems.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 14px; color: #555;">${item.name} (x${item.qty})</td>
            <td style="padding: 10px 0; font-size: 14px; color: #555; text-align: right;">
                ${formatCurrency(item.price * item.qty)}
            </td>
        </tr>
    `).join('');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2>ORDER CONFIRMATION</h2>
                <p style="font-size: 18px; margin: 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
            </div>

            <div style="padding: 20px;">
                <p>Hello ${recipientName},</p>
                <p>Thank you for your order with **Pindows Elite**! We're preparing your items for shipment and will notify you when they have been sent out.</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #ccc;">
                            <th style="padding: 10px 0; text-align: left; font-size: 16px;">Item Description</th>
                            <th style="padding: 10px 0; text-align: right; font-size: 16px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItemsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 2px solid #ccc;">
                            <td style="padding: 10px 0; font-size: 16px; font-weight: bold; text-align: left;">TOTAL PAID</td>
                            <td style="padding: 10px 0; font-size: 16px; font-weight: bold; text-align: right;">
                                ${formatCurrency(order.totalPrice)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <h3 style="margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Shipping Details</h3>
                <p style="margin: 5px 0;"><strong>Recipient:</strong> ${order.buyer.name}</p>
                <p style="margin: 5px 0;"><strong>Contact:</strong> ${order.shippingAddress.contactPhone}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}</p>
                <p style="margin: 5px 0;"><strong>Country:</strong> ${order.shippingAddress.country}</p>
                
                <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
                    You can track your order using your email address and order number on our website.
                </p>
            </div>
        </div>
    `;

    return htmlContent;
};