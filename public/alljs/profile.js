document.addEventListener("DOMContentLoaded", () => {
  fetch("/session")
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn) {
        window.location.href = "/login.html";
        return;
      }

      const { name, email, role } = data.user;

      // Display user info
      document.querySelector(".user-name").textContent = name;
      document.querySelector(".user-email").textContent = email;

      // Role-based UI display
      const studentSection = document.querySelector(".student-section");
      const expertSection = document.querySelector(".expert-section");

      if (role === "expert") {
        studentSection.style.display = "none";
        expertSection.style.display = "block";
      } else {
        expertSection.style.display = "none";
        studentSection.style.display = "block";
      }

      // Handle mark as completed for students
      document.querySelectorAll(".mark-completed-btn").forEach(button => {
        button.addEventListener("click", () => {
          button.disabled = true;
          button.textContent = "Marked as Completed";

          // TODO: Send update to backend
          console.log("Session marked as completed by student.");

          const statusText = document.createElement("p");
          statusText.textContent = "Status: Awaiting expert confirmation";
          statusText.style.color = "green";
          button.parentElement.appendChild(statusText);
        });
      });

    })
    .catch(err => {
      console.error("Session check failed:", err);
      window.location.href = "/login.html";
    });
});
