document.addEventListener("DOMContentLoaded", () => {
  const sessionArea = document.getElementById("user-session-area");

  fetch("/session")
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn) {
        // If on protected page (like profile.html), redirect to login
        if (isProtectedPage()) {
          window.location.href = "/login.html";
        }

        // Only update navbar if the element exists
        if (sessionArea) {
          sessionArea.innerHTML = `<a href="/login.html" class="login-btn">Login</a>`;
        }
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
                <a href="/logout">Logout</a>
              </div>
            </div>
          `;
        }

        // Save userType to localStorage (optional but useful for quick access)
        if (user.userType) {
          localStorage.setItem("userType", user.userType);
        }
      }
    })
    .catch(err => {
      console.error("Session check failed:", err);
      if (sessionArea) {
        sessionArea.innerHTML = `<a href="/login.html" class="login-btn">Login</a>`;
      }
    });

  // Check if current page is protected
  function isProtectedPage() {
    const protectedPaths = ["/profile.html", "/admin-dashboard.html", "/expert-dashboard.html"];
    return protectedPaths.includes(window.location.pathname);
  }
});
