const API_KEY = 'YOUR_API_KEY'; // Replace with your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const moviesContainer = document.getElementById('movies');
const searchInput = document.getElementById('search');
const pagination = document.getElementById('pagination');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = modal.querySelector('.close-btn');

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let isLoading = false;

// Fetch movies either popular or by search query
async function fetchMovies(query = '', page = 1) {
  if (isLoading) return;
  isLoading = true;
  moviesContainer.setAttribute('aria-busy', 'true');
  moviesContainer.innerHTML = `<p class="loading">Loading movies...</p>`;

  const endpoint = query
    ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    : `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch movies.');
    const data = await response.json();
    totalPages = data.total_pages;
    displayMovies(data.results);
    setupPagination(page, totalPages);
  } catch (error) {
    moviesContainer.innerHTML = `<p class="error">Error loading movies: ${error.message}</p>`;
  } finally {
    moviesContainer.setAttribute('aria-busy', 'false');
    isLoading = false;
  }
}

// Display movie cards
function displayMovies(movies) {
  if (!movies.length) {
    moviesContainer.innerHTML = `<p class="no-results">No movies found.</p>`;
    return;
  }

  moviesContainer.innerHTML = '';
  movies.forEach(movie => {
    const { id, title, poster_path, vote_average } = movie;
    const poster = poster_path ? IMG_URL + poster_path : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const card = document.createElement('article');
    card.className = 'movie-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', `${title}, rating ${vote_average} stars. Click for details.`);

    card.innerHTML = `
      <img src="${poster}" alt="Poster of ${title}" loading="lazy" />
      <div class="movie-info">
        <h3>${title}</h3>
        <p class="rating">⭐ ${vote_average.toFixed(1)}</p>
      </div>
    `;

    card.addEventListener('click', () => openModal(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(id);
      }
    });

    moviesContainer.appendChild(card);
  });
}

// Pagination buttons
function setupPagination(current, total) {
  pagination.innerHTML = '';

  const prevBtn = createPageButton('Prev', current > 1, () => {
    if (current > 1) {
      currentPage--;
      fetchMovies(currentQuery, currentPage);
      scrollToTop();
    }
  });

  const nextBtn = createPageButton('Next', current < total, () => {
    if (current < total) {
      currentPage++;
      fetchMovies(currentQuery, currentPage);
      scrollToTop();
    }
  });

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${current} of ${total}`;
  pageInfo.className = 'page-info';

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(nextBtn);
}

function createPageButton(text, enabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'page-btn';
  btn.textContent = text;
  btn.disabled = !enabled;
  if (enabled) btn.addEventListener('click', onClick);
  return btn;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Modal handling
async function openModal(movieId) {
  modalBody.innerHTML = `<p class="loading">Loading details...</p>`;
  modal.classList.remove('hidden');
  modalBody.focus();

  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch movie details.');
    const movie = await res.json();
    displayModalContent(movie);
  } catch (error) {
    modalBody.innerHTML = `<p class="error">Error loading details: ${error.message}</p>`;
  }
}

function displayModalContent(movie) {
  const {
    title,
    overview,
    poster_path,
    vote_average,
    release_date,
    genres = [],
    runtime,
  } = movie;

  const poster = poster_path ? IMG_URL + poster_path : 'https://via.placeholder.com/500x750?text=No+Image';

  modalBody.innerHTML = `
    <h2 id="modalTitle">${title}</h2>
    <img src="${poster}" alt="Poster of ${title}" loading="lazy" style="max-width:100%; border-radius: 8px; margin-bottom: 1rem;" />
    <p><strong>Rating:</strong> ⭐ ${vote_average.toFixed(1)}</p>
    <p><strong>Release Date:</strong> ${release_date || 'N/A'}</p>
    <p><strong>Runtime:</strong> ${runtime ? runtime + ' minutes' : 'N/A'}</p>
    <p><strong>Genres:</strong> ${genres.map(g => g.name).join(', ') || 'N/A'}</p>
    <p><strong>Overview:</strong><br>${overview || 'No overview available.'}</p>
  `;
}

// Close modal
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

function closeModal() {
  modal.classList.add('hidden');
  modalBody.innerHTML = '';
  // Return focus to search input after closing modal
  searchInput.focus();
}

// Search input with debounce
let debounceTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    currentQuery = e.target.value.trim();
    currentPage = 1;
    fetchMovies(currentQuery, currentPage);
  }, 500);
});

// Initial load popular movies
fetchMovies();
