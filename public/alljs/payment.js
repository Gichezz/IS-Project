// JavaScript to handle dynamic data population
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);

    // Function to populate payment info from URL parameters
    function populateData(data) {
        const service = data.serviceName || urlParams.get('service') || 'Service Name';
        const amountValue = data.amount || urlParams.get('amount') || 0;

        document.getElementById('service-name').textContent = service;
        document.getElementById('payment-amount').textContent = 'KES ' + parseFloat(amountValue).toLocaleString();
        document.getElementById('pay-button-amount').textContent = 'KES ' + parseFloat(amountValue).toLocaleString();
        
    }

    // Initialize form with default data
    populateData({});

    // Handle form submission for payment
    document.getElementById('paymentForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // Get phone input and validate it starts with 2547 (Safaricom format)
        const phoneNumber = document.getElementById('phone').value.trim();
        if (!phoneNumber.match(/^2547\d{8}$/)) {
            alert("Please enter a valid Kenyan phone number starting with 2547...");
            return;
        }

        // Show loading indicator while STK Push is initiated
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('payButton').disabled = true;

        // Get payment details
        const amount = document.getElementById('payment-amount').textContent.replace('KES ', '').replace(/,/g, '');
        const requestData = {
            phone: phoneNumber,
            amount: amount,
            service: document.getElementById('service-name').textContent,
            
        };

        // Send STK Push request to backend
        fetch('/api/mpesa/stk/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('loadingIndicator').style.display = 'none';

            if (data.success) {
                // Extract CheckoutRequestID from M-Pesa API response
                const checkoutID = data.data.CheckoutRequestID;

                // Show waiting message
                document.getElementById('status').textContent = "📲 Waiting for user to complete payment on phone...";

                // Start polling backend to check payment status every 3 seconds
                const interval = setInterval(() => {
                    fetch(`/api/payment-status/${checkoutID}`)
                        .then(res => res.json())
                        .then(result => {
                            if (result.found) {
                                clearInterval(interval); // Stop checking once result found

                                if (result.status === "success") {
                                    // Show success message and hide form
                                    document.getElementById('paymentForm').style.display = 'none';
                                    document.getElementById('confirmationMessage').style.display = 'block';
                                    document.getElementById('status').textContent = "✅ Payment Successful!";
                                } else {
                                    // Payment failed/cancelled
                                    document.getElementById('status').textContent = "❌ Payment Cancelled.";
                                    document.getElementById('payButton').disabled = false;
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Polling error:", err);
                        });
                }, 3000); // Poll every 3 seconds
            } else {
                // STK push failed on backend
                alert('Payment failed: ' + (data.message || 'Unknown error'));
                document.getElementById('payButton').disabled = false;
            }
        })
        .catch(error => {
            console.error('Error during STK push:', error);
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('payButton').disabled = false;
            alert('An error occurred while processing your payment');
        });
    });
});
