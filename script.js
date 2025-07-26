const API_KEY = "d67780e9";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const moviesContainer = document.getElementById("moviesContainer");
const watchlistContainer = document.getElementById("WatchlistContainer");
const searchEmptyState = document.getElementById("searchEmptyState");
const watchlistEmptyState = document.getElementById("watchlistEmptyState");
const notification = document.getElementById("notification");
const movieCount = document.getElementById("movieCount");
const totalDuration = document.getElementById("totalDuration");
const watchlistStats = document.getElementById("watchlistStats");
const searchSection = document.getElementById("searchSection");

// Search functionality
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (query === "") return;

    // Show loading state
    searchBtn.innerHTML = '<div class="loading"></div>';
    searchBtn.disabled = true;

    try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
        const data = await res.json();
        
        moviesContainer.innerHTML = "";
        
        if (data.Response === "True") {
            // Show search section and hide empty state
            searchSection.classList.add("show");
            searchEmptyState.style.display = "none";
            
            // Create movie cards with staggered animation
            data.Search.forEach((movie, index) => {
                setTimeout(() => {
                    const card = createMovieCard(movie, true);
                    card.style.opacity = "0";
                    card.style.transform = "translateY(20px)";
                    moviesContainer.appendChild(card);
                    
                    // Animate card entrance
                    setTimeout(() => {
                        card.style.transition = "all 0.5s ease";
                        card.style.opacity = "1";
                        card.style.transform = "translateY(0)";
                    }, 50);
                }, index * 100);
            });
        } else {
            // Show search section with empty state
            searchSection.classList.add("show");
            searchEmptyState.style.display = "block";
            searchEmptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No movies found for "${query}"</p>
            `;
        }
    } catch (error) {
        showNotification("Error searching for movies", "error");
        // Show search section with error state
        searchSection.classList.add("show");
        searchEmptyState.style.display = "block";
        searchEmptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error searching for movies</p>
        `;
    } finally {
        // Reset button state
        searchBtn.innerHTML = '<i class="fas fa-play"></i><span>Search</span>';
        searchBtn.disabled = false;
    }
});

// Enter key search
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

// Clear search when input is cleared
searchInput.addEventListener("input", (e) => {
    if (e.target.value.trim() === "") {
        hideSearchSection();
    }
});

function createMovieCard(movie, isSearchResult = false) {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    
    // Get movie details for search results
    const title = movie.Title || movie.title || "Unknown Title";
    const year = movie.Year || movie.year || "Unknown Year";
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Poster";
    const imdbID = movie.imdbID || movie.imdbId;
    
    card.innerHTML = `
        <img src="${poster}" alt="${title}" loading="lazy">
        <div class="movie-info">
            <h3>${title}</h3>
            <p><i class="fas fa-calendar"></i> ${year}</p>
            <button class="${isSearchResult ? 'add-btn' : 'remove-btn'}">
                <i class="fas ${isSearchResult ? 'fa-plus' : 'fa-trash'}"></i>
                ${isSearchResult ? 'Add to Watchlist' : 'Remove'}
            </button>
        </div>
    `;
    
    const button = card.querySelector("button");
    
    if (isSearchResult) {
        button.onclick = () => addToWatchlist(imdbID);
    } else {
        button.onclick = () => removeFromWatchlist(imdbID);
    }
    
    return card;
}

function addToWatchlist(imdbID) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    
    if (!watchlist.includes(imdbID)) {
        watchlist.push(imdbID);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        loadWatchlist();
        showNotification("Added to watchlist!", "success");
        
        // Clear search results and hide search section
        clearSearchResults();
    } else {
        showNotification("Already in watchlist!", "info");
    }
}

function removeFromWatchlist(imdbID) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    watchlist = watchlist.filter(id => id !== imdbID);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    loadWatchlist();
    showNotification("Removed from watchlist!", "success");
}

function clearSearchResults() {
    moviesContainer.innerHTML = "";
    searchEmptyState.style.display = "block";
    searchInput.value = "";
    hideSearchSection();
}

function hideSearchSection() {
    searchSection.classList.remove("show");
}

function formatDuration(minutes) {
    if (!minutes || minutes === "N/A") return "Unknown";
    
    const mins = parseInt(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours === 0) {
        return `${remainingMins} minutes`;
    } else if (remainingMins === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} minutes`;
    }
}

function updateWatchlistStats(movies) {
    const count = movies.length;
    let totalMinutes = 0;
    
    movies.forEach(movie => {
        if (movie.Runtime && movie.Runtime !== "N/A") {
            const runtime = movie.Runtime.replace(" min", "");
            totalMinutes += parseInt(runtime) || 0;
        }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    movieCount.textContent = `${count} movie${count !== 1 ? 's' : ''}`;
    
    if (totalMinutes === 0) {
        totalDuration.textContent = "Duration unknown";
    } else if (hours === 0) {
        totalDuration.textContent = `${minutes} minutes`;
    } else if (minutes === 0) {
        totalDuration.textContent = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        totalDuration.textContent = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
    
    // Show/hide stats based on count
    if (count === 0) {
        watchlistStats.style.display = "none";
    } else {
        watchlistStats.style.display = "flex";
    }
}

async function loadWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    watchlistContainer.innerHTML = "";
    
    if (watchlist.length === 0) {
        // Show empty state
        watchlistEmptyState.style.display = "block";
        updateWatchlistStats([]);
        return;
    }
    
    // Hide empty state
    watchlistEmptyState.style.display = "none";
    
    // Show loading state
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";
    loadingDiv.style.cssText = "grid-column: 1 / -1; text-align: center; padding: 2rem;";
    watchlistContainer.appendChild(loadingDiv);
    
    try {
        const movies = [];
        
        for (let i = 0; i < watchlist.length; i++) {
            const id = watchlist[i];
            const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`);
            const movie = await res.json();
            
            if (movie.Response === "True") {
                movies.push(movie);
                const card = createMovieCard(movie, false);
                card.style.opacity = "0";
                card.style.transform = "translateY(20px)";
                watchlistContainer.appendChild(card);
                
                // Staggered animation
                setTimeout(() => {
                    card.style.transition = "all 0.5s ease";
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0)";
                }, i * 100);
            }
        }
        
        // Remove loading div
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
        
        // Update stats after loading all movies
        updateWatchlistStats(movies);
        
    } catch (error) {
        showNotification("Error loading watchlist", "error");
        watchlistContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #ff6b6b;">Error loading watchlist</p>';
    }
}

function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    // Set background color based on type
    switch (type) {
        case "success":
            notification.style.background = "linear-gradient(45deg, #4ecdc4, #44a08d)";
            break;
        case "error":
            notification.style.background = "linear-gradient(45deg, #ff6b6b, #ee5a52)";
            break;
        case "info":
            notification.style.background = "linear-gradient(45deg, #ffd700, #ffb347)";
            break;
    }
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
    loadWatchlist();
    
    // Add some initial animation to the header
    const logo = document.querySelector(".logo");
    logo.style.opacity = "0";
    logo.style.transform = "translateY(-20px)";
    
    setTimeout(() => {
        logo.style.transition = "all 1s ease";
        logo.style.opacity = "1";
        logo.style.transform = "translateY(0)";
    }, 500);
});