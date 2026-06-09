const LIBROS_DATA_URL = "./libros.json";
const libros = [];
const brokenCoverUrls = new Set();
const COVER_PLACEHOLDER_DATA_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="78" viewBox="0 0 56 78"><rect width="56" height="78" fill="#efe5d8"/><rect x="8" y="10" width="40" height="58" rx="4" fill="#f8f2e8" stroke="#d8c8b5"/><text x="28" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#7a6f61">Sin</text><text x="28" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#7a6f61">portada</text></svg>'
)}`;

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

function getCoverSrc(portada) {
  if (!portada || brokenCoverUrls.has(portada)) {
    return COVER_PLACEHOLDER_DATA_URL;
  }
  return portada;
}

function handleCoverError(event) {
  const img = event.currentTarget;
  const originalSrc = img?.dataset?.originalSrc || "";
  if (originalSrc) {
    brokenCoverUrls.add(originalSrc);
  }
  img.src = COVER_PLACEHOLDER_DATA_URL;
  img.classList.add("cover-placeholder");
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
      const coverSrc = getCoverSrc(libro.portada);

      return `<tr>
        <td><img class="cover" src="${escapeHtml(coverSrc)}" data-original-src="${escapeHtml(
        libro.portada
      )}" alt="Portada de ${escapeHtml(libro.titulo)}" loading="lazy" /></td>
        <td>${escapeHtml(libro.titulo)}</td>
        <td>${escapeHtml(libro.autor)}</td>
        <td>${escapeHtml(libro.genero)}</td>
        <td>${escapeHtml(libro.idioma)}</td>
        <td><span class="status ${statusClass}">${escapeHtml(capitalize(libro.estado))}</span></td>
      </tr>`;
    })
    .join("");

  const coverImages = catalogTableBody.querySelectorAll("img.cover");
  coverImages.forEach((img) => {
    img.addEventListener("error", handleCoverError, { once: true });
  });
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
