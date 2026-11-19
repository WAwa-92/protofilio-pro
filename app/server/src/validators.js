const PROJECT_TYPES = ["projet", "experience"];
const SKILL_CATEGORIES = ["technique", "transversale"];

class ValidationError extends Error {}

function isEmpty(value) {
	return value === undefined || value === null || String(value).trim() === "";
}

function parseId(value) {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError("Identifiant invalide");
	}
	return id;
}

function text(value, label, { required = false, max = 255 } = {}) {
	if (isEmpty(value)) {
		if (required) throw new ValidationError(`${label} est obligatoire`);
		return null;
	}
	const str = String(value).trim();
	if (str.length > max) {
		throw new ValidationError(`${label} ne doit pas dépasser ${max} caractères`);
	}
	return str;
}

function email(value, label, { required = false } = {}) {
	const str = text(value, label, { required, max: 255 });
	if (str !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
		throw new ValidationError(`${label} n'est pas valide`);
	}
	return str;
}

// Accepte une URL http(s) ou un chemin local (ex. /cv/cv.pdf)
function url(value, label) {
	const str = text(value, label, { max: 500 });
	if (str === null || str.startsWith("/")) return str;
	try {
		const parsed = new URL(str);
		if (parsed.protocol === "http:" || parsed.protocol === "https:") return str;
	} catch {
		// géré ci-dessous
	}
	throw new ValidationError(`${label} doit être une URL http(s) ou un chemin commençant par /`);
}

function date(value, label) {
	const str = text(value, label, { max: 10 });
	if (str === null) return null;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || Number.isNaN(Date.parse(str))) {
		throw new ValidationError(`${label} doit être une date au format AAAA-MM-JJ`);
	}
	return str;
}

function choice(value, allowed, label, { required = false, fallback = null } = {}) {
	if (isEmpty(value)) {
		if (required) throw new ValidationError(`${label} est obligatoire`);
		return fallback;
	}
	if (!allowed.includes(value)) {
		throw new ValidationError(`${label} doit être l'une des valeurs : ${allowed.join(", ")}`);
	}
	return value;
}

function level(value) {
	if (isEmpty(value)) return 3;
	const n = Number(value);
	if (!Number.isInteger(n) || n < 1 || n > 5) {
		throw new ValidationError("Le niveau doit être un entier entre 1 et 5");
	}
	return n;
}

function bool(value) {
	return value === true || value === "true";
}

function idList(value, label) {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) throw new ValidationError(`${label} doit être une liste`);
	return [...new Set(value.map(parseId))];
}

module.exports = {
	PROJECT_TYPES,
	SKILL_CATEGORIES,
	ValidationError,
	parseId,
	text,
	email,
	url,
	date,
	choice,
	level,
	bool,
	idList,
};
