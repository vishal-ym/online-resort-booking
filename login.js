/*
 * Mud House Hampi - Secure Login Handler
 * Manages administrative credentials, sessions, and redirection
 */

document.addEventListener("DOMContentLoaded", () => {
  // Sync page theme with local storage preferences
  const savedTheme = localStorage.getItem("mudhouse_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // If already authenticated, redirect directly to dashboard
  const session = sessionStorage.getItem("mudhouse_admin_session");
  if (session && session.startsWith("jwt-token-mhh")) {
    window.location.href = "admin.html";
    return;
  }

  // Handle Login Submission
  const loginForm = document.getElementById("admin-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const user = document.getElementById("login-username").value.trim();
      const pass = document.getElementById("login-password").value.trim();
      
      if (user === "admin" && pass === "password123") {
        // Generate mock session JWT
        const mockJwt = `jwt-token-mhh-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("mudhouse_admin_session", mockJwt);
        
        // Redirect to dashboard
        window.location.href = "admin.html";
      } else {
        alert("Invalid administrative credentials. Please verify your username and password.");
      }
    });
  }
});
