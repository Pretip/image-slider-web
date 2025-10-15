const auth = new Auth();

document.querySelector(".logout-btn").addEventListener("click", (e) => {
	auth.logOut();
});