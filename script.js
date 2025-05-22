// Your TMDB API key — change this to your own key!
const API_KEY = '8a29ba8f1e4d21bf2e9c52061a541f05';

// Base URLs for API and images
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Grab elements from the page to update later
const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navbar');

let currentPage = 1;      // Track current page for pagination
let currentQuery = '';    // Current search term, empty means popular movies
let totalPages = 1;       // Total pages available from API

// Mobile menu toggle — show/hide nav links when button clicked
menuToggle.addEventListener('click', () => {
  // Check current state of menu (expanded or not)
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  
  // Toggle the state
  menuToggle.setAttribute('aria-expanded', !isExpanded);
  navLinks.classList.toggle('active');
});

// Function to get movies from TMDB API, either popular or searched
async function fetchMovies(query = '', page = 1) {
  // Show loading message while waiting
  moviesGrid.innerHTML = '<p class="loading">Loading movies...</p>';

  try {
    let url;
    
    // If there's a search query, build search API URL, otherwise get popular movies
    if (query) {
      url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
      url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`;
    }

    // Fetch the data from the API
    const response = await fetch(url);

    // Check for HTTP errors
    if (!response.ok) throw new Error('Failed to fetch movies.');

    // Parse JSON response
    const data = await response.json();

    // Save total pages info for pagination
    totalPages = data.total_pages;

    // Display movies on page
    renderMovies(data.results);

    // Update pagination buttons and display
    updatePagination();
  } catch (error) {
    // Show error message if something goes wrong
    moviesGrid.innerHTML = `<p class="error">Error loading movies: ${error.message}</p>`;
  }
}

// Create movie cards on the page
function renderMovies(movies) {
  // If no movies found, show message
  if (!movies.length) {
    moviesGrid.innerHTML = '<p>No movies found.</p>';
    return;
  }

  // Clear previous movies
  moviesGrid.innerHTML = '';

  movies.forEach(movie => {
    // Destructure movie details for easy use
    const {
      id,
      title,
      release_date,
      poster_path,
      vote_average,
      genre_ids = [],
    } = movie;

    // Extract year from release date or default to N/A
    const year = release_date ? release_date.split('-')[0] : 'N/A';

    // Use poster image if available, else placeholder
    const poster = poster_path ? IMG_URL + poster_path : 'https://via.placeholder.com/500x750?text=No+Image';

    // Create the card container
    const card = document.createElement('article');
    card.className = 'movie-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', `${title}, released in ${year}, rating ${vote_average.toFixed(1)}`);

    // Fill the card with content
    card.innerHTML = `
      <img class="movie-poster" src="${poster}" alt="Poster of ${title}" loading="lazy" />
      <div class="movie-info">
        <h3>${title} <span class="release-year">(${year})</span></h3>
        <div class="genres">${getGenreBadges(genre_ids)}</div>
        <p class="rating">⭐ ${vote_average.toFixed(1)}</p>
        <button class="btn-book" aria-label="Book ticket for ${title}">Book Ticket</button>
      </div>
    `;

    // When user clicks or presses enter/space on the card, open modal with details
    card.addEventListener('click', () => openModal(id));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(id);
      }
    });

    // Add card to the grid
    moviesGrid.appendChild(card);
  });
}

// Map TMDB genre IDs to genre names
const genreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western'
};

// Return genre badges HTML based on genre IDs (max 3 genres shown)
function getGenreBadges(ids) {
  if (!ids.length) return '<span class="genre-badge">Unknown</span>';

  return ids.slice(0, 3)
    .map(id => `<span class="genre-badge">${genreMap[id] || 'Other'}</span>`)
    .join('');
}

// Show movie details in a modal popup
async function openModal(movieId) {
  // Show modal and loading message
  modal.classList.remove('hidden');
  modalBody.innerHTML = '<p class="loading">Loading details...</p>';

  try {
    // Fetch detailed info about the movie
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
    if (!response.ok) throw new Error('Failed to fetch movie details.');

    const movie = await response.json();

    // Destructure needed details
    const {
      title,
      overview,
      poster_path,
      vote_average,
      release_date,
      genres = [],
      runtime,
    } = movie;

    // Use poster or fallback
    const poster = poster_path ? IMG_URL + poster_path : 'https://via.placeholder.com/500x750?text=No+Image';

    // Fill modal content
    modalBody.innerHTML = `
      <h2 id="modalTitle">${title}</h2>
      <img src="${poster}" alt="Poster of ${title}" loading="lazy" />
      <p><strong>Rating:</strong> ⭐ ${vote_average.toFixed(1)}</p>
      <p><strong>Release Date:</strong> ${release_date || 'N/A'}</p>
      <p><strong>Runtime:</strong> ${runtime ? runtime + ' min' : 'N/A'}</p>
      <p><strong>Genres:</strong> ${genres.map(g => g.name).join(', ') || 'N/A'}</p>
      <p>${overview || 'No description available.'}</p>
    `;

    // Set focus to close button for accessibility
    closeBtn.focus();
  } catch (error) {
    modalBody.innerHTML = `<p class="error">Error loading details: ${error.message}</p>`;
  }
}

// Close modal when close button clicked
closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Close modal if user clicks outside modal content
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Close modal on Escape key press
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});

// Handle search input with debounce to avoid too many API calls
let debounceTimeout;

searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    currentQuery = e.target.value.trim();
    currentPage = 1;  // Reset to page 1 on new search
    fetchMovies(currentQuery, currentPage);
  }, 500);
});

// Pagination: go to previous page if not on first
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchMovies(currentQuery, currentPage);
  }
});

// Pagination: go to next page if not on last
nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    fetchMovies(currentQuery, currentPage);
  }
});

// Update pagination display and enable/disable buttons
function updatePagination() {
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

// Load popular movies right away when page loads
fetchMovies();
