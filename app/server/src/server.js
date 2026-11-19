const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const rateLimit = require("express-rate-limit");

const { query, execute, withTransaction, initializeDatabase } = require("./db");
const v = require("./validators");

const { ValidationError } = v;

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

if (!JWT_SECRET || JWT_SECRET.length < 32) {
	console.error("JWT_SECRET doit être défini (32 caractères minimum) dans app/server/.env");
	process.exit(1);
}

const PROJECT_SELECT = `
	SELECT p.*,
		COALESCE(
			json_agg(
				json_build_object('id_skill', s.id_skill, 'name', s.name, 'category', s.category, 'level', s.level)
				ORDER BY s.name
			) FILTER (WHERE s.id_skill IS NOT NULL),
			'[]'
		) AS skills
	FROM project p
	LEFT JOIN project_skill ps ON ps.id_project = p.id_project
	LEFT JOIN skill s ON s.id_skill = ps.id_skill
`;

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Trop de tentatives de connexion, réessayez plus tard" },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

const publicPath = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicPath));

// Centralise la gestion d'erreurs : 400 pour les données invalides, 500 générique sinon
function route(handler) {
	return async (req, res) => {
		try {
			await handler(req, res);
		} catch (error) {
			if (error instanceof ValidationError) {
				return res.status(400).json({ message: error.message });
			}
			console.error(error);
			return res.status(500).json({ message: "Erreur serveur" });
		}
	};
}

function notFound(res, label) {
	return res.status(404).json({ message: `${label} introuvable` });
}

async function replaceProjectSkills(run, idProject, skillIds) {
	if (skillIds.length) {
		const { rows } = await run("SELECT id_skill FROM skill WHERE id_skill = ANY($1::int[])", [skillIds]);
		if (rows.length !== skillIds.length) {
			throw new ValidationError("Une compétence sélectionnée est introuvable");
		}
	}
	await run("DELETE FROM project_skill WHERE id_project = $1", [idProject]);
	for (const idSkill of skillIds) {
		await run("INSERT INTO project_skill (id_project, id_skill) VALUES ($1, $2)", [idProject, idSkill]);
	}
}

function readProjectInput(body) {
	const startDate = v.date(body.start_date, "La date de début");
	const endDate = v.date(body.end_date, "La date de fin");

	if (startDate && endDate && endDate < startDate) {
		throw new ValidationError("La date de fin doit être postérieure à la date de début");
	}

	return {
		title: v.text(body.title, "Le titre", { required: true, max: 160 }),
		description: v.text(body.description, "La description", { required: true, max: 5000 }),
		type: v.choice(body.type, v.PROJECT_TYPES, "Le type", { required: true }),
		startDate,
		endDate,
		projectUrl: v.url(body.project_url, "Le lien du projet"),
		imageUrl: v.url(body.image_url, "L'image"),
		isFeatured: v.bool(body.is_featured),
		skillIds: v.idList(body.skill_ids, "Les compétences"),
	};
}

function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ")
		? authHeader.slice(7)
		: null;

	if (!token) {
		return res.status(401).json({ message: "Token manquant" });
	}

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.admin = payload;
		return next();
	} catch {
		return res.status(401).json({ message: "Token invalide" });
	}
}

app.get("/api/health", (_req, res) => {
	res.json({ ok: true, status: "up" });
});

app.get("/api/public/home", route(async (_req, res) => {
	const [profile] = await query("SELECT * FROM profile ORDER BY id_profile ASC LIMIT 1");
	const projects = await query(
		`${PROJECT_SELECT} GROUP BY p.id_project ORDER BY p.is_featured DESC, p.created_at DESC LIMIT 6`
	);
	const skills = await query(
		"SELECT * FROM skill ORDER BY category ASC, level DESC, name ASC"
	);

	res.json({ profile, projects, skills });
}));

app.get("/api/projects", route(async (req, res) => {
	const type = req.query.type;

	if (type && !v.PROJECT_TYPES.includes(type)) {
		return res.status(400).json({ message: "Type invalide" });
	}

	const projects = type
		? await query(
				`${PROJECT_SELECT} WHERE p.type = $1 GROUP BY p.id_project ORDER BY p.created_at DESC`,
				[type]
			)
		: await query(`${PROJECT_SELECT} GROUP BY p.id_project ORDER BY p.created_at DESC`);

	return res.json(projects);
}));

app.get("/api/skills", route(async (_req, res) => {
	const skills = await query(
		"SELECT * FROM skill ORDER BY category ASC, level DESC, name ASC"
	);
	res.json(skills);
}));

app.post("/api/contact", route(async (req, res) => {
	const senderName = v.text(req.body.sender_name, "Le nom", { required: true, max: 120 });
	const senderEmail = v.email(req.body.sender_email, "L'email", { required: true });
	const subject = v.text(req.body.subject, "Le sujet", { required: true, max: 160 });
	const message = v.text(req.body.message, "Le message", { required: true, max: 5000 });

	await query(
		`INSERT INTO contact_message (sender_name, sender_email, subject, message)
		 VALUES ($1, $2, $3, $4)`,
		[senderName, senderEmail, subject, message]
	);

	return res.status(201).json({ message: "Message envoyé" });
}));

app.post("/api/admin/login", loginLimiter, route(async (req, res) => {
	const email = v.email(req.body.email, "L'email", { required: true });
	const password = req.body.password;
	if (typeof password !== "string" || password.length === 0) {
		throw new ValidationError("Le mot de passe est obligatoire");
	}

	const [admin] = await query("SELECT * FROM admin WHERE email = $1", [email]);
	const isValid = admin ? await bcrypt.compare(password, admin.password_hash) : false;
	if (!isValid) {
		return res.status(401).json({ message: "Identifiants invalides" });
	}

	const token = jwt.sign({ id: admin.id_admin, email: admin.email }, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	});

	return res.json({ token, email: admin.email });
}));

app.get("/api/admin/profile", requireAuth, route(async (_req, res) => {
	const [profile] = await query("SELECT * FROM profile ORDER BY id_profile ASC LIMIT 1");
	res.json(profile);
}));

app.put("/api/admin/profile", requireAuth, route(async (req, res) => {
	const body = req.body;
	const profile = {
		full_name: v.text(body.full_name, "Le nom", { required: true, max: 120 }),
		title: v.text(body.title, "Le titre", { required: true, max: 160 }),
		bio: v.text(body.bio, "La bio", { max: 3000 }),
		email: v.email(body.email, "L'email"),
		phone: v.text(body.phone, "Le téléphone", { max: 30 }),
		location: v.text(body.location, "La localisation", { max: 120 }),
		cv_url: v.url(body.cv_url, "Le CV"),
		linkedin_url: v.url(body.linkedin_url, "Le lien LinkedIn"),
		github_url: v.url(body.github_url, "Le lien GitHub"),
	};

	const [current] = await query("SELECT id_profile FROM profile ORDER BY id_profile ASC LIMIT 1");
	if (!current) {
		return notFound(res, "Profil");
	}

	await execute(
		`UPDATE profile SET
			full_name = $1,
			title = $2,
			bio = $3,
			email = $4,
			phone = $5,
			location = $6,
			cv_url = $7,
			linkedin_url = $8,
			github_url = $9,
			updated_at = NOW()
		WHERE id_profile = $10`,
		[
			profile.full_name,
			profile.title,
			profile.bio,
			profile.email,
			profile.phone,
			profile.location,
			profile.cv_url,
			profile.linkedin_url,
			profile.github_url,
			current.id_profile,
		]
	);

	return res.json({ message: "Profil mis à jour" });
}));

app.get("/api/admin/projects", requireAuth, route(async (_req, res) => {
	const projects = await query(`${PROJECT_SELECT} GROUP BY p.id_project ORDER BY p.created_at DESC`);
	res.json(projects);
}));

app.post("/api/admin/projects", requireAuth, route(async (req, res) => {
	const input = readProjectInput(req.body);

	await withTransaction(async (run) => {
		const { rows } = await run(
			`INSERT INTO project
			(title, description, type, start_date, end_date, project_url, image_url, is_featured)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id_project`,
			[input.title, input.description, input.type, input.startDate, input.endDate,
				input.projectUrl, input.imageUrl, input.isFeatured]
		);
		await replaceProjectSkills(run, rows[0].id_project, input.skillIds);
	});

	return res.status(201).json({ message: "Projet ajouté" });
}));

app.put("/api/admin/projects/:id", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const input = readProjectInput(req.body);

	const found = await withTransaction(async (run) => {
		const { rowCount } = await run(
			`UPDATE project SET
				title = $1,
				description = $2,
				type = $3,
				start_date = $4,
				end_date = $5,
				project_url = $6,
				image_url = $7,
				is_featured = $8,
				updated_at = NOW()
			WHERE id_project = $9`,
			[input.title, input.description, input.type, input.startDate, input.endDate,
				input.projectUrl, input.imageUrl, input.isFeatured, id]
		);
		if (rowCount === 0) return false;
		await replaceProjectSkills(run, id, input.skillIds);
		return true;
	});

	if (!found) return notFound(res, "Projet");
	return res.json({ message: "Projet modifié" });
}));

app.delete("/api/admin/projects/:id", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const deleted = await execute("DELETE FROM project WHERE id_project = $1", [id]);
	if (deleted === 0) return notFound(res, "Projet");
	return res.json({ message: "Projet supprimé" });
}));

app.get("/api/admin/skills", requireAuth, route(async (_req, res) => {
	const skills = await query("SELECT * FROM skill ORDER BY category ASC, level DESC");
	res.json(skills);
}));

app.post("/api/admin/skills", requireAuth, route(async (req, res) => {
	const name = v.text(req.body.name, "Le nom", { required: true, max: 120 });
	const category = v.choice(req.body.category, v.SKILL_CATEGORIES, "La catégorie", { required: true });
	const level = v.level(req.body.level);

	await query("INSERT INTO skill (name, category, level) VALUES ($1, $2, $3)", [name, category, level]);

	res.status(201).json({ message: "Compétence ajoutée" });
}));

app.put("/api/admin/skills/:id", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const name = v.text(req.body.name, "Le nom", { required: true, max: 120 });
	const category = v.choice(req.body.category, v.SKILL_CATEGORIES, "La catégorie", { required: true });
	const level = v.level(req.body.level);

	const updated = await execute(
		"UPDATE skill SET name = $1, category = $2, level = $3 WHERE id_skill = $4",
		[name, category, level, id]
	);
	if (updated === 0) return notFound(res, "Compétence");
	return res.json({ message: "Compétence modifiée" });
}));

app.delete("/api/admin/skills/:id", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const deleted = await execute("DELETE FROM skill WHERE id_skill = $1", [id]);
	if (deleted === 0) return notFound(res, "Compétence");
	return res.json({ message: "Compétence supprimée" });
}));

app.get("/api/admin/messages", requireAuth, route(async (_req, res) => {
	const messages = await query(
		"SELECT * FROM contact_message ORDER BY is_read ASC, created_at DESC"
	);
	res.json(messages);
}));

app.patch("/api/admin/messages/:id/read", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const updated = await execute("UPDATE contact_message SET is_read = TRUE WHERE id_message = $1", [id]);
	if (updated === 0) return notFound(res, "Message");
	return res.json({ message: "Message marqué comme lu" });
}));

app.delete("/api/admin/messages/:id", requireAuth, route(async (req, res) => {
	const id = v.parseId(req.params.id);
	const deleted = await execute("DELETE FROM contact_message WHERE id_message = $1", [id]);
	if (deleted === 0) return notFound(res, "Message");
	return res.json({ message: "Message supprimé" });
}));

app.use("/api", (_req, res) => {
	res.status(404).json({ message: "Route introuvable" });
});

// Erreur de JSON mal formé dans le corps de la requête
app.use((error, _req, res, next) => {
	if (error.type === "entity.parse.failed") {
		return res.status(400).json({ message: "JSON invalide" });
	}
	return next(error);
});

app.get("*", (req, res, next) => {
	if (req.path.startsWith("/api")) {
		return next();
	}
	return res.sendFile(path.join(publicPath, "index.html"));
});

initializeDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Portfolio lancé sur http://localhost:${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Impossible de démarrer le serveur :", error);
		process.exit(1);
	});
