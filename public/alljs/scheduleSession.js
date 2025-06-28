document.addEventListener('DOMContentLoaded', function() {
  // Get the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const expertName = urlParams.get('expert');
  const expertId = urlParams.get('expertId');
  const skillName = urlParams.get('skill');
  const skillId = urlParams.get('skillId');
  const amount = urlParams.get('amount');

  // Populate the form fields
  document.getElementById('skillName').value = skillName;
  document.getElementById('expertName').value = expertName;
  document.getElementById('skillId').value = skillId;
  document.getElementById('expertId').value = expertId;

  // Get student info from session
  const studentId = sessionStorage.getItem('userId');
  const studentEmail = sessionStorage.getItem('userEmail');
  
  if (studentId && studentEmail) {
    document.getElementById('studentId').value = studentId;
    document.getElementById('studentEmail').value = studentEmail;
  } else {
    // Redirect to login if not logged in
    window.location.href = '/login.html';
  }

  // Form submission handler
  document.getElementById('sessionRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const sessionData = {
      skill_id: document.getElementById('skillId').value,
      skill_requested: document.getElementById('skillName').value,
      student_id: document.getElementById('studentId').value,
      student_email: document.getElementById('studentEmail').value,
      expert_id: document.getElementById('expertId').value,
      requested_time: document.getElementById('sessionDate').value,
      description: document.getElementById('sessionDescription').value
    };

    // Send the session request to the server
    fetch('/api/session-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Redirect to payment page with all necessary info
        window.location.href = `/payment.html?service=${encodeURIComponent(skillName)}&amount=${amount}&sessionId=${data.sessionId}`;
      } else {
        alert('Failed to schedule session. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
  });
});