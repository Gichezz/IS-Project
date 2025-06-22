document.addEventListener("DOMContentLoaded", () => {
  const sessionCards = document.querySelectorAll(".session-card");

  sessionCards.forEach(card => {
    const sessionId = card.dataset.sessionId;
    const statusElement = card.querySelector(".status");
    const acceptBtn = card.querySelector(".accept-btn");
    const rejectBtn = card.querySelector(".reject-btn");

    acceptBtn.addEventListener("click", () => {
      updateSessionStatus(sessionId, "accepted", true, () => {
        statusElement.textContent = "Status: Accepted";
        statusElement.className = "status accepted";

        // Replace buttons with 'Mark as Completed'
        const completeBtn = document.createElement("button");
        completeBtn.className = "complete-btn";
        completeBtn.textContent = "Mark as Completed";

        completeBtn.addEventListener("click", () => {
          updateSessionStatus(sessionId, "completed", true, () => {
            statusElement.textContent = "Status: Completed";
            statusElement.className = "status completed";
            completeBtn.disabled = true;
          });
        });

        const actionDiv = card.querySelector(".session-actions");
        actionDiv.innerHTML = "";
        actionDiv.appendChild(completeBtn);

        // Show modal popup
        document.getElementById("redirectModal").style.display = "block";

        // Redirect to chat page after short delay
        setTimeout(() => {
        window.location.href = `/connect.html?session_id=${sessionId}`;
        }, 1500);
      });
    });

    rejectBtn.addEventListener("click", () => {
      updateSessionStatus(sessionId, "rejected", false, () => {
        statusElement.textContent = "Status: Rejected";
        statusElement.className = "status rejected";

        const actionDiv = card.querySelector(".session-actions");
        actionDiv.innerHTML = "<span style='color:#888;'>Session Rejected</span>";
      });
    });
  });
});

function updateSessionStatus(id, status, expertCompleted, callback) {
  fetch(`/api/session-requests/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status,
      expert_completed: expertCompleted
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        callback();
      } else {
        alert("Failed to update session status.");
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("An error occurred while updating the session.");
    });
}
