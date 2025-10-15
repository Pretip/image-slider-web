const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username === "" || password === "") {
    message.textContent = "Please fill in all fields.";
    message.className = "error";
  } else if (username === "user1" && password === "pas$word@012") {
    message.textContent = "Login successful!!!";
    message.className = "success";

    // Set the authentication flag in local storage
    // Use "1" as a string for localStorage
    localStorage.setItem("auth", "1"); 

    // Redirect after login
    window.location.replace("main.html");


  } else {
    message.textContent = "Invalid username or password.";
    message.className = "error";
    localStorage.removeItem("auth");
  }
});
