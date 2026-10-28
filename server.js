import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

// Built-in middleware to parse JSON payloads
app.use(express.json());
app.use(cookieParser());


// PART 2: CUSTOM MIDDLEWARE

// 1. Logging Middleware (intercepts all requests)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} request to ${req.url}`);
  next(); // VERY IMPORTANT: passes control to the next middleware/route
});

// 2. Validation Middleware (specific to the POST route)
const validateGamePayload = (req, res, next) => {
  const { title, platform, status, rating } = req.body;

  // Validate title (must exist, be a string, and not be empty)
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: "Invalid payload: 'title' is required and must be a non-empty string." });
  }

  // Validate platform
  if (!platform || typeof platform !== 'string' || platform.trim() === '') {
    return res.status(400).json({ error: "Invalid payload: 'platform' is required and must be a non-empty string." });
  }

  // Validate status
  if (!status || typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({ error: "Invalid payload: 'status' is required and must be a non-empty string." });
  }

  // Validate rating (must exist and be a number)
  if (rating === undefined || typeof rating !== 'number') {
    return res.status(400).json({ error: "Invalid payload: 'rating' is required and must be a number." });
  }

  // If everything is valid, proceed to the route handler
  next();
};


// IN-MEMORY DATA

let games = [
  { id: 1, title: "Hades", platform: "PC", status: "Completed", rating: 9.5 },
  { id: 2, title: "Hollow Knight", platform: "Switch", status: "Playing", rating: 9.0 }
];

let nextId = 3;


// ROUTES (PART 1)


// 1. GET: Retrieve all games
app.get('/api/items', (req, res) => {
  res.status(200).json(games);
});

// 2. GET: Retrieve a single game by ID
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const game = games.find(g => g.id === id);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  
  res.status(200).json(game);
});

// 3. POST: Create a new game (with validation middleware)
app.post('/api/items', validateGamePayload, (req, res) => {
  const { title, platform, status, rating } = req.body;

  const newGame = {
    id: nextId++,
    title,
    platform,
    status,
    rating
  };

  games.push(newGame);
  res.status(201).json(newGame);
});

// 4. DELETE: Remove a game by ID
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = games.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Game not found" });
  }

  games.splice(index, 1);
  res.status(204).send();
});


// L12 ACTIVITY: COOKIES & SESSIONS
// -----------------------------------------
app.get('/visit-count', (req, res) => {
  // 1. Check if the 'visits' cookie exists, if not start at 0
  let visits = req.cookies.visits ? parseInt(req.cookies.visits) : 0;

  // 2. Increment the counter
  visits++;

  // 3. Set the cookie back to the client (expires in 1 day)
  res.cookie('visits', visits, { maxAge: 86400000, httpOnly: true });

  // 4. Send the text response
  res.send(`You have visited this page ${visits} time(s). Refresh to see the counter go up!`);
});


// PART 3: CENTRALIZED ERROR HANDLING


// 1. Catch-all for unknown routes (404)
app.use((req, res, next) => {
  res.status(404).json({ 
    error: "Not Found", 
    message: `The route ${req.method} ${req.url} does not exist on this server.` 
  });
});

// 2. Global error handler (500)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: "Something went wrong on our end. Please try again later." 
  });
});


// START SERVER

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});