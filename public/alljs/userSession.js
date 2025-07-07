document.addEventListener("DOMContentLoaded", () => {
  const sessionArea = document.getElementById("user-session-area");
  const signupBtn = document.getElementById("signup-btn");

  fetch("/session")
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn) {
        // If on protected page (like profile.html), redirect to login
        if (isProtectedPage()) {
          // Use location.replace to prevent back navigation
          window.location.replace("/login.html");
        }
        // Only update navbar if the element exists
        if (sessionArea) {
          sessionArea.innerHTML = `<a href="/login.html" class="login-btn">Login</a>`;
        }
        // Show signup if not logged in
        if (signupBtn) signupBtn.style.display = ""; 
      } else {

        // Set sessionStorage from server data
        sessionStorage.setItem('userId', data.sessionData.userId);
        sessionStorage.setItem('userEmail', data.sessionData.userEmail);
        sessionStorage.setItem('isLoggedIn', 'true');
        
        const user = data.user;

        // Update navbar with profile/logout dropdown
        if (sessionArea) {
          sessionArea.innerHTML = `
            <div class="user-dropdown">
              <i class="fas fa-user-circle profile-icon"></i>
              <div class="dropdown-content">
                <a href="/profile.html">Profile</a>
                <a href="#" id="logout-link">Logout</a>
              </div>
            </div>
          `;
        }

        // Hide signup if logged in
        if (signupBtn) signupBtn.style.display = "none"; 
        // Save userType to localStorage (optional but useful for quick access)
        if (user.userType) {
          localStorage.setItem("userType", user.userType);
        }
        // Attach logout handler
        setTimeout(() => {
          const logoutLink = document.getElementById("logout-link");
          if (logoutLink) {
            logoutLink.addEventListener("click", function(e) {
              e.preventDefault();
              // Clear session and local storage
              sessionStorage.clear();
              localStorage.clear();
              // Call backend logout
              fetch("/logout").then(() => {
                window.location.replace("/login.html");
              });
            });
          }
        }, 0);
      }
    })
    .catch(err => {
      console.error("Session check failed:", err);
      if (sessionArea) {
        sessionArea.innerHTML = `<a href="/login.html" class="login-btn">Login</a>`;
      }
      if (signupBtn) signupBtn.style.display = "";
    });

  // Check if current page is protected
  function isProtectedPage() {
    const protectedPaths = ["/profile.html", "/admin-dashboard.html", "/expert-dashboard.html"];
    return protectedPaths.includes(window.location.pathname);
  }
});
