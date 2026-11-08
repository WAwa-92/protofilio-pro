async function fetchHomeData() {
  const response = await fetch("/api/public/home");
  if (!response.ok) {
    throw new Error("Impossible de charger les données.");
  }
  return response.json();
}

function renderSkills(skills) {
  const container = document.getElementById("skills-list");
  container.innerHTML = "";

  if (!skills.length) {
    container.innerHTML = '<p class="muted">Aucune compétence ajoutée pour le moment.</p>';
    return;
  }

  skills.forEach((skill) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${skill.name}</h3>
      <p class="muted">Catégorie : ${skill.category}</p>
      <span class="chip">Niveau ${skill.level || 3}/5</span>
    `;
    container.appendChild(card);
  });
}

function renderProjects(projects) {
  const container = document.getElementById("featured-projects");
  container.innerHTML = "";

  const list = projects.filter((item) => item.is_featured).slice(0, 6);
  const fallback = list.length ? list : projects.slice(0, 6);

  if (!fallback.length) {
    container.innerHTML = '<p class="muted">Aucun projet disponible.</p>';
    return;
  }

  fallback.forEach((project) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="muted">${project.type}</p>
      <p>${project.description}</p>
      ${project.project_url ? `<a href="${project.project_url}" target="_blank" rel="noopener">Voir le projet</a>` : ""}
    `;
    container.appendChild(card);
  });
}

function renderProfile(profile) {
  if (!profile) return;
  document.getElementById("profile-name").textContent = `${profile.full_name} - ${profile.title}`;
  document.getElementById("profile-bio").textContent = profile.bio || "Profil en cours de mise à jour.";
}

(async function init() {
  try {
    const data = await fetchHomeData();
    renderProfile(data.profile);
    renderSkills(data.skills || []);
    renderProjects(data.projects || []);
  } catch (error) {
    document.getElementById("profile-bio").textContent = error.message;
  }
})();
