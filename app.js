const LIBROS_DATA_URL = "./libros.json";
const libros = [];

const catalogTableBody = document.getElementById("catalogTableBody");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const languageFilter = document.getElementById("languageFilter");
const statusFilter = document.getElementById("statusFilter");
const resultsCount = document.getElementById("resultsCount");

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredLibros() {
  const term = normalizeText(searchInput.value);
  const genre = normalizeText(genreFilter.value);
  const language = normalizeText(languageFilter.value);
  const status = normalizeText(statusFilter.value);

  return libros.filter((libro) => {
    const matchesTerm =
      !term ||
      [libro.titulo, libro.autor, libro.genero].some((value) =>
        normalizeText(value).includes(term)
      );
    const matchesGenre = !genre || normalizeText(libro.genero) === genre;
    const matchesLanguage = !language || normalizeText(libro.idioma) === language;
    const matchesStatus = !status || normalizeText(libro.estado) === status;
    return matchesTerm && matchesGenre && matchesLanguage && matchesStatus;
  });
}

function renderFilters() {
  const genres = [...new Set(libros.map((l) => l.genero.trim()).filter(Boolean))].sort();
  const languages = [...new Set(libros.map((l) => l.idioma.trim()).filter(Boolean))].sort();

  const currentGenre = genreFilter.value;
  const currentLanguage = languageFilter.value;

  genreFilter.innerHTML = `<option value="">Todos</option>${genres
    .map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`)
    .join("")}`;
  languageFilter.innerHTML = `<option value="">Todos</option>${languages
    .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
    .join("")}`;

  genreFilter.value = currentGenre;
  languageFilter.value = currentLanguage;
}

function renderCatalog() {
  const filtered = getFilteredLibros();
  resultsCount.textContent = `${filtered.length} resultado(s)`;

  if (filtered.length === 0) {
    catalogTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No hay libros para mostrar.</td></tr>';
    return;
  }

  catalogTableBody.innerHTML = filtered
    .map((libro) => {
      const statusClass =
        libro.estado === "disponible" ? "status-disponible" : "status-circulacion";

      return `<tr>
        <td><img class="cover" src="${escapeHtml(libro.portada)}" alt="Portada de ${escapeHtml(
        libro.titulo
      )}" loading="lazy" onerror="this.src='https://via.placeholder.com/54x72?text=Sin+imagen';" /></td>
        <td>${escapeHtml(libro.titulo)}</td>
        <td>${escapeHtml(libro.autor)}</td>
        <td>${escapeHtml(libro.genero)}</td>
        <td>${escapeHtml(libro.idioma)}</td>
        <td><span class="status ${statusClass}">${escapeHtml(capitalize(libro.estado))}</span></td>
      </tr>`;
    })
    .join("");
}

function capitalize(value) {
  if (!value) {
    return "";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderAll() {
  renderFilters();
  renderCatalog();
}

function sanitizeLibro(rawLibro) {
  return {
    portada: String(rawLibro?.portada || "").trim(),
    titulo: String(rawLibro?.titulo || "").trim(),
    autor: String(rawLibro?.autor || "").trim(),
    genero: String(rawLibro?.genero || "").trim(),
    idioma: String(rawLibro?.idioma || "").trim(),
    estado: normalizeText(rawLibro?.estado) === "en circulación" ? "en circulación" : "disponible",
  };
}

async function loadLibros() {
  const response = await fetch(LIBROS_DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${LIBROS_DATA_URL}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("El archivo libros.json debe contener un array.");
  }

  const normalized = data.map(sanitizeLibro).filter((libro) => libro.titulo && libro.autor);
  libros.splice(0, libros.length, ...normalized);
}

async function init() {
  try {
    await loadLibros();
    renderAll();
  } catch (error) {
    resultsCount.textContent = "Error cargando catálogo";
    catalogTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No se pudo cargar libros.json.</td></tr>';
    console.error(error);
  }
}

searchInput.addEventListener("input", renderCatalog);
genreFilter.addEventListener("change", renderCatalog);
languageFilter.addEventListener("change", renderCatalog);
statusFilter.addEventListener("change", renderCatalog);

init();
