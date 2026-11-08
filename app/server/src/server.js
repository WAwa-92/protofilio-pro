const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { query, initializeDatabase } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const publicPath = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicPath));

function toBool(value) {
	return value === true || value === "true";
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

app.get("/api/public/home", async (_req, res) => {
	try {
		const [profile] = await query("SELECT * FROM profile ORDER BY id_profile ASC LIMIT 1");
		const projects = await query(
			"SELECT * FROM project ORDER BY is_featured DESC, created_at DESC LIMIT 6"
		);
		const skills = await query(
			"SELECT * FROM skill ORDER BY category ASC, level DESC, name ASC"
		);

		res.json({ profile, projects, skills });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/projects", async (req, res) => {
	try {
		const type = req.query.type;

		if (type && !["projet", "experience"].includes(type)) {
			return res.status(400).json({ message: "Type invalide" });
		}

		const projects = type
			? await query(
					"SELECT * FROM project WHERE type = $1 ORDER BY created_at DESC",
					[type]
				)
			: await query("SELECT * FROM project ORDER BY created_at DESC");

		return res.json(projects);
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/skills", async (_req, res) => {
	try {
		const skills = await query(
			"SELECT * FROM skill ORDER BY category ASC, level DESC, name ASC"
		);
		res.json(skills);
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.post("/api/contact", async (req, res) => {
	try {
		const { sender_name, sender_email, subject, message } = req.body;

		if (!sender_name || !sender_email || !subject || !message) {
			return res.status(400).json({ message: "Tous les champs sont obligatoires" });
		}

		await query(
			`INSERT INTO contact_message (sender_name, sender_email, subject, message)
			 VALUES ($1, $2, $3, $4)`,
			[sender_name, sender_email, subject, message]
		);

		return res.status(201).json({ message: "Message envoyé" });
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.post("/api/admin/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email et mot de passe requis" });
		}

		const [admin] = await query("SELECT * FROM admin WHERE email = $1", [email]);
		if (!admin) {
			return res.status(401).json({ message: "Identifiants invalides" });
		}

		const isValid = await bcrypt.compare(password, admin.password_hash);
		if (!isValid) {
			return res.status(401).json({ message: "Identifiants invalides" });
		}

		const token = jwt.sign({ id: admin.id_admin, email: admin.email }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
		});

		return res.json({ token, email: admin.email });
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/admin/profile", requireAuth, async (_req, res) => {
	try {
		const [profile] = await query("SELECT * FROM profile ORDER BY id_profile ASC LIMIT 1");
		res.json(profile);
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.put("/api/admin/profile", requireAuth, async (req, res) => {
	try {
		const {
			full_name,
			title,
			bio,
			email,
			phone,
			location,
			cv_url,
			linkedin_url,
			github_url,
		} = req.body;

		const [current] = await query("SELECT id_profile FROM profile ORDER BY id_profile ASC LIMIT 1");
		if (!current) {
			return res.status(404).json({ message: "Profil introuvable" });
		}

		await query(
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
				full_name,
				title,
				bio,
				email,
				phone,
				location,
				cv_url,
				linkedin_url,
				github_url,
				current.id_profile,
			]
		);

		return res.json({ message: "Profil mis à jour" });
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/admin/projects", requireAuth, async (_req, res) => {
	try {
		const projects = await query("SELECT * FROM project ORDER BY created_at DESC");
		res.json(projects);
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.post("/api/admin/projects", requireAuth, async (req, res) => {
	try {
		const {
			title,
			description,
			type,
			start_date,
			end_date,
			project_url,
			image_url,
			is_featured,
		} = req.body;

		if (!title || !description || !type) {
			return res.status(400).json({ message: "title, description et type sont obligatoires" });
		}

		await query(
			`INSERT INTO project
			(title, description, type, start_date, end_date, project_url, image_url, is_featured)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[title, description, type, start_date || null, end_date || null, project_url || null, image_url || null, toBool(is_featured)]
		);

		return res.status(201).json({ message: "Projet ajouté" });
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.put("/api/admin/projects/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			title,
			description,
			type,
			start_date,
			end_date,
			project_url,
			image_url,
			is_featured,
		} = req.body;

		await query(
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
			[title, description, type, start_date || null, end_date || null, project_url || null, image_url || null, toBool(is_featured), id]
		);

		return res.json({ message: "Projet modifié" });
	} catch (error) {
		return res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.delete("/api/admin/projects/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		await query("DELETE FROM project WHERE id_project = $1", [id]);
		res.json({ message: "Projet supprimé" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/admin/skills", requireAuth, async (_req, res) => {
	try {
		const skills = await query("SELECT * FROM skill ORDER BY category ASC, level DESC");
		res.json(skills);
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.post("/api/admin/skills", requireAuth, async (req, res) => {
	try {
		const { name, category, level } = req.body;
		if (!name || !category) {
			return res.status(400).json({ message: "name et category sont obligatoires" });
		}

		await query("INSERT INTO skill (name, category, level) VALUES ($1, $2, $3)", [
			name,
			category,
			level || 3,
		]);

		res.status(201).json({ message: "Compétence ajoutée" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.put("/api/admin/skills/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, category, level } = req.body;
		await query(
			"UPDATE skill SET name = $1, category = $2, level = $3 WHERE id_skill = $4",
			[name, category, level, id]
		);
		res.json({ message: "Compétence modifiée" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.delete("/api/admin/skills/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		await query("DELETE FROM skill WHERE id_skill = $1", [id]);
		res.json({ message: "Compétence supprimée" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.get("/api/admin/messages", requireAuth, async (_req, res) => {
	try {
		const messages = await query(
			"SELECT * FROM contact_message ORDER BY is_read ASC, created_at DESC"
		);
		res.json(messages);
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.patch("/api/admin/messages/:id/read", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		await query("UPDATE contact_message SET is_read = TRUE WHERE id_message = $1", [id]);
		res.json({ message: "Message marqué comme lu" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
});

app.delete("/api/admin/messages/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		await query("DELETE FROM contact_message WHERE id_message = $1", [id]);
		res.json({ message: "Message supprimé" });
	} catch (error) {
		res.status(500).json({ message: "Erreur serveur", detail: error.message });
	}
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
