// Fetch pending expert accounts from server
fetch("/api/pending-experts")
  .then((res) => res.json())
  .then((experts) => {
    const container = document.getElementById("expert-requests-container");

    if (!experts.length) {
      container.innerHTML = "<p>No pending expert requests.</p>";
      return;
    }

    experts.forEach((expert) => {
      const card = document.createElement("div");
      card.className = "expert-card";

      card.innerHTML = `
        <h3>${expert.name}</h3>
        <p><strong>Email:</strong> ${expert.email}</p>
        <p><strong>Skills:</strong> ${expert.skills}</p>
        <p><strong>Description:</strong> ${expert.description}</p>
        <div class="button-group">
          <button class="approve-btn" data-id="${expert.id}">Approve</button>
          <button class="reject-btn" data-id="${expert.id}">Reject</button>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("Error loading expert requests:", err);
  });

// Event delegation for approve/reject buttons
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("approve-btn") || e.target.classList.contains("reject-btn")) {
    const expertId = e.target.getAttribute("data-id");
    const approved = e.target.classList.contains("approve-btn");

    fetch(`/api/expert-status/${expertId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          e.target.closest(".expert-card").remove();
        } else {
          alert("Action failed: " + data.message);
        }
      })
      .catch(err => {
        console.error("Status update error:", err);
        alert("Could not update expert status.");
      });
  }
});
