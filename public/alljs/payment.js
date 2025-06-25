
document.addEventListener('DOMContentLoaded', function () {
    // Get URL parameters like service and amount
    const urlParams = new URLSearchParams(window.location.search);

    /**
     * Populate payment details from URL or passed data
     */
    function populateData(data) {
        const service = data.serviceName || urlParams.get('service') || 'Service Name';
        const amountValue = data.amount || urlParams.get('amount') || 0;

        // Display values on the page
        document.getElementById('service-name').textContent = service;
        document.getElementById('payment-amount').textContent = 'KES ' + parseFloat(amountValue).toLocaleString();
        document.getElementById('pay-button-amount').textContent = 'KES ' + parseFloat(amountValue).toLocaleString();
    }

    // Initialize the form with URL data
    populateData({});

    // Handle form submission
    document.getElementById('paymentForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent page reload

        // ✅ Validate phone number format (must be Safaricom)
        const phoneNumber = document.getElementById('phone').value.trim();
        if (!phoneNumber.match(/^2547\d{8}$/)) {
            alert("Please enter a valid Kenyan phone number starting with 2547...");
            return;
        }

        // Show loading spinner & disable button
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('payButton').disabled = true;

        // Get payment amount and service name
        const amount = document.getElementById('payment-amount').textContent.replace('KES ', '').replace(/,/g, '');
        //  Extract only skill from full service string
        const serviceFull = document.getElementById('service-name').textContent;
        const serviceParts = serviceFull.split('-');
        const skillOnly = serviceParts.length > 1 ? serviceParts[1].trim().split(' ')[0] : serviceFull.trim();
        // "Zarian - Ai Expert" → "Ai"

        const requestData = {
            phone: phoneNumber,
            amount: amount,
            service: skillOnly, // ✅ send only "Ai"
        };

        // Send STK Push request to your backend
        fetch('/api/mpesa/stk/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            // Hide loader
            document.getElementById('loadingIndicator').style.display = 'none';

            // ✅ If STK push was successful
            if (data.success) {
                const checkoutID = data.data.CheckoutRequestID;

                // Show "waiting for user to pay" status
                document.getElementById('status').textContent = "📲 Waiting for user to complete payment on phone...";

                // Start polling every 3 seconds to check if payment went through
                const interval = setInterval(() => {
                    fetch(`/api/mpesa/payment-status/${checkoutID}`)
                        .then(res => res.json())
                        .then(result => {
                            console.log("📡 Polling response:", result);

                            if (result.found && result.status) {
                                // ✅ Only stop polling if result is final (success or failed)
                                if (["success", "failed"].includes(result.status)) {
                                    clearInterval(interval);

                                    if (result.status === "success") {
                                        // ✅ Payment successful
                                        document.getElementById('paymentForm').style.display = 'none';
                                        document.getElementById('confirmationMessage').style.display = 'block';
                                        document.getElementById('status').textContent = "✅ Payment Successful!";
                                    } else {
                                        // ❌ Payment failed or cancelled
                                        document.getElementById('status').textContent = "❌ Payment Failed or Cancelled.";
                                        document.getElementById('payButton').disabled = false;
                                    }
                                } else {
                                    // Still pending – can show spinner or leave silently
                                    console.log("⌛ Payment still pending...");
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Polling error:", err);
                        });
                }, 3000); // ⏳ Check every 3 seconds
            } else {
                // ❌ STK push failed on backend
                alert('Payment failed: ' + (data.message || 'Unknown error'));
                document.getElementById('payButton').disabled = false;
            }
        })
        .catch(error => {
            // Handle network/backend errors
            console.error('Error during STK push:', error);
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('payButton').disabled = false;
            alert('An error occurred while processing your payment');
        });
    });
});

