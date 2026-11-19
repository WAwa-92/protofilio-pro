// Contenu initial issu du CV de Wael Bakkay (utilisé uniquement si les tables sont vides)
const profile = {
	full_name: "Wael Bakkay",
	title: "Étudiant en Bachelor Informatique · Recherche de stage en cybersécurité",
	bio: "Étudiant en deuxième année de Bachelor Informatique à la 3W Academy, je recherche un stage de 4 mois, du 5 avril au 31 juillet 2027. Après une première expérience en développement web chez Advienne Consulting, je souhaite approfondir mes compétences en sécurité informatique et la sécurisation des applications et des systèmes.",
	email: "wael.bakkay@3wacademy.fr",
	phone: null,
	location: "Île-de-France",
	cv_url: "/cv/wael_bakkay_cv.pdf",
	linkedin_url: "https://www.linkedin.com/in/waelbakkay",
	github_url: null,
};

const skills = [
	{ name: "JavaScript", category: "technique" },
	{ name: "TypeScript", category: "technique" },
	{ name: "PHP", category: "technique" },
	{ name: "Python", category: "technique" },
	{ name: "Java", category: "technique" },
	{ name: "SQL", category: "technique" },
	{ name: "HTML", category: "technique" },
	{ name: "CSS", category: "technique" },
	{ name: "MySQL", category: "technique" },
	{ name: "MongoDB", category: "technique" },
	{ name: "Node.js", category: "technique" },
	{ name: "React", category: "technique" },
	{ name: "Next.js", category: "technique" },
	{ name: "Docker", category: "technique" },
	{ name: "Git", category: "technique" },
	{ name: "GitLab", category: "technique" },
	{ name: "Authentification sécurisée", category: "technique" },
	{ name: "Prévention des attaques XSS", category: "technique" },
	{ name: "Gestion des sessions", category: "technique" },
	{ name: "Intégration d'API d'IA", category: "technique" },
	{ name: "Rigueur et sens de l'organisation", category: "transversale" },
	{ name: "Autonomie", category: "transversale" },
	{ name: "Esprit d'équipe", category: "transversale" },
	{ name: "Capacité d'adaptation", category: "transversale" },
	{ name: "Gestion des priorités", category: "transversale" },
];

const projects = [
	{
		title: "Stagiaire en développement web : Advienne Consulting",
		description:
			"Conception et développement d'une plateforme web de gestion des réseaux sociaux pour un complexe sportif. Intégration d'API d'intelligence artificielle et de Meta pour automatiser la publication de contenus. Création de supports de communication visuelle, notamment pour le tournoi « Padel Samedis ».",
		type: "experience",
		start_date: "2026-05-01",
		end_date: "2026-07-31",
		is_featured: true,
		skills: ["HTML", "CSS", "JavaScript", "PHP", "MySQL", "Intégration d'API d'IA"],
	},
	{
		title: "Sites web full-stack : projets académiques 3W Academy",
		description:
			"Développement de sites web full-stack : sites de restaurants, sites hôteliers et application inspirée du jeu Akinator. Mise en pratique des technologies front-end et back-end, développement de fonctionnalités interactives et gestion des données.",
		type: "projet",
		start_date: "2025-10-01",
		end_date: "2026-11-30",
		is_featured: true,
		skills: [],
	},
	{
		title: "Employé polyvalent : Restaurant L'Amira",
		description:
			"Emplois saisonniers en cuisine, au bar, en service en salle et à l'encaissement. Capacité à respecter des procédures, gérer les imprévus et travailler efficacement sous pression.",
		type: "experience",
		start_date: "2024-07-01",
		end_date: "2026-08-31",
		is_featured: false,
		skills: ["Rigueur et sens de l'organisation", "Gestion des priorités", "Esprit d'équipe"],
	},
	{
		title: "Bénévole : Unir et agir pour le développement",
		description:
			"Participation à la collecte et au transport de denrées alimentaires, ainsi qu'à l'organisation logistique d'un voyage humanitaire au Sénégal.",
		type: "experience",
		start_date: "2025-01-01",
		end_date: "2025-04-30",
		is_featured: false,
		skills: ["Esprit d'équipe", "Capacité d'adaptation"],
	},
	{
		title: "Ouvrier : SIP",
		description:
			"Préparation des surfaces et pose de films de protection sur les trains, dans le respect des procédures et des consignes de sécurité.",
		type: "experience",
		start_date: "2025-09-01",
		end_date: "2025-10-31",
		is_featured: false,
		skills: ["Rigueur et sens de l'organisation", "Esprit d'équipe"],
	},
];

module.exports = { profile, skills, projects };
