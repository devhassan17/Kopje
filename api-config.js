// API configuration for local/cloud server
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api'; // Use relative path when deployed to GCloud

// Global score management functions
window.currentScoreToSubmit = 0;

function showNameEntry(score) {
    window.currentScoreToSubmit = score;
    const finalScoreDisplay = document.getElementById('final-score-display');
    const nameEntryModal = document.getElementById('name-entry-modal');
    
    if (finalScoreDisplay) finalScoreDisplay.innerText = score;
    if (nameEntryModal) nameEntryModal.style.display = 'flex';
}

function closeNameEntry() {
    const modal = document.getElementById('name-entry-modal');
    if (modal) modal.style.display = 'none';
}

function submitScore() {
    const nameInput = document.getElementById('player-name-input');
    const name = nameInput ? nameInput.value.trim() : "";
    
    if (!name) {
        alert("Please enter your name!");
        return;
    }

    const scoreData = {
        name: name,
        score: window.currentScoreToSubmit
    };

    console.log("Submitting score to:", `${API_BASE_URL}/submit`);

    fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to submit score");
        return response.json();
    })
    .then(data => {
        console.log("Score submitted successfully!", data);
        closeNameEntry();
        openLeaderboard();
    })
    .catch(error => {
        console.error("Error submitting score:", error);
        alert("Failed to submit score. Make sure the server is running on http://localhost:3000");
    });
}

function openLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'flex';
        fetchLeaderboard();
    }
}

function closeLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) modal.style.display = 'none';
}

function fetchLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<div class="leaderboard-item"><span>Loading scores...</span></div>';

    fetch(`${API_BASE_URL}/leaderboard`)
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        return response.json();
    })
    .then(data => {
        listContainer.innerHTML = '';
        let rank = 1;
        
        if (data.length === 0) {
            listContainer.innerHTML = '<div class="leaderboard-item"><span>No scores yet. Be the first!</span></div>';
            return;
        }

        data.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (rank === 1) item.classList.add('rank-1');
            item.innerHTML = `
                <span class="rank">${rank}</span>
                <span class="player-name">${entry.name}</span>
                <span class="player-score">${entry.score}</span>
            `;
            listContainer.appendChild(item);
            rank++;
        });
    })
    .catch(error => {
        console.error("Error fetching leaderboard:", error);
        listContainer.innerHTML = '<div class="leaderboard-item"><span>Error connecting to server.</span></div>';
    });
}
