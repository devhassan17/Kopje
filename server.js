const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'leaderboard.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize leaderboard file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// GET /api/leaderboard - Returns the top scores
app.get('/api/leaderboard', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        // Sort by score descending and return top 10
        const topScores = data.sort((a, b) => b.score - a.score).slice(0, 10);
        res.json(topScores);
    } catch (error) {
        console.error("Error reading leaderboard:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// POST /api/submit - Submits a new score
app.post('/api/submit', (req, res) => {
    const { name, score } = req.body;
    
    if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: "Name and score are required" });
    }
    
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const newEntry = {
            name,
            score,
            timestamp: new Date().toISOString()
        };
        
        data.push(newEntry);
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        
        res.status(201).json({ message: "Score submitted successfully!" });
    } catch (error) {
        console.error("Error saving score:", error);
        res.status(500).json({ error: "Failed to save score" });
    }
});

// Serve the static game files if needed (for GCloud deployment)
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
});
