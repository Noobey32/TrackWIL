/**
 * Sign-up rules enforced on the server in signupAction.
 * Returns a user-facing error string, or null when the value is acceptable.
 */
const STUDENT_EMAIL_PATTERN = /^(\d{8})@ctucareer\.co\.za$/i;

export function validateStudentSignupEmail(email: string): string | null {
	const normalizedEmail = email.trim().toLowerCase();
	const match = normalizedEmail.match(STUDENT_EMAIL_PATTERN);
	if (!match) {
		return "Please use a valid CTU email.";
	}

	const year = Number.parseInt(match[1].slice(0, 4), 10);
	const currentYear = new Date().getFullYear();
	const maximumYear = currentYear + 2;

	if (year <= 2000 || year > maximumYear) {
		return "Please use a valid CTU email.";
	}

	return null;
}

export function validateSignupPassword(password: string): string | null {
	if (password.length < 8) {
		return "Password must be at least 8 characters.";
	}
	if (!/[A-Z]/.test(password)) {
		return "Password must include at least one uppercase letter.";
	}
	if (!/[a-z]/.test(password)) {
		return "Password must include at least one lowercase letter.";
	}
	if (!/[0-9]/.test(password)) {
		return "Password must include at least one number.";
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		return "Password must include at least one special character.";
	}

	return null;
}
