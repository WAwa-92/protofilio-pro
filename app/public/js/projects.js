const projectList = document.getElementById("projects-list");
const filterButtons = document.querySelectorAll("[data-filter]");

async function loadProjects(filter = "all") {
  const url = filter === "all" ? "/api/projects" : `/api/projects?type=${filter}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des projets.");
  }

  return response.json();
}

function renderProjects(projects) {
  projectList.innerHTML = "";

  if (!projects.length) {
    projectList.innerHTML = '<p class="muted">Aucun élément à afficher.</p>';
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="muted">${project.type}</p>
      <p>${project.description}</p>
      <p class="muted">Période : ${project.start_date || "-"} ${project.end_date ? `→ ${project.end_date}` : ""}</p>
      ${project.project_url ? `<a href="${project.project_url}" target="_blank" rel="noopener">Lien du projet</a>` : ""}
    `;
    projectList.appendChild(card);
  });
}

async function refresh(filter = "all") {
  try {
    const projects = await loadProjects(filter);
    renderProjects(projects);
  } catch (error) {
    projectList.innerHTML = `<p class="status error">${error.message}</p>`;
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    refresh(btn.dataset.filter);
  });
});

refresh();
