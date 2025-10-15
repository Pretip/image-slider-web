class Auth {
	constructor() {
        document.querySelector("body").style.visibility = "hidden";
		const auth = localStorage.getItem("auth");
		this.validateAuth(auth);
	}

	validateAuth(auth) {
		if (auth != 1) {
			window.location.replace("/");
		} else {
            document.querySelector("body").style.visibility = "visible";
		}
	}

	logOut() {
		localStorage.removeItem("auth");
		window.location.replace("/");
	}
}