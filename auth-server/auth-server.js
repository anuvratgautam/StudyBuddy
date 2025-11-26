// auth-server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
app.use(cors()); // allow requests from frontend
app.use(bodyParser.json());

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "change_this";
const PORT = process.env.PORT || 9000;

if (!CLIENT_ID) {
  console.error("Please set GOOGLE_CLIENT_ID in .env");
  process.exit(1);
}

const client = new OAuth2Client(CLIENT_ID);

// simple in-memory user-map; replace with DB in production
const users = new Map();

app.post("/auth/google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    const payload = ticket.getPayload();
    const googleSub = payload.sub;
    const email = payload.email;
    const name = payload.name;

    // create or update user in-memory
    let user = users.get(googleSub);
    if (!user) {
      user = { id: googleSub, email, name, createdAt: new Date().toISOString() };
      users.set(googleSub, user);
      console.log("Created user:", googleSub);
    }

    // issue server JWT (optional)
    const token = jwt.sign({ uid: googleSub, email }, JWT_SECRET, { expiresIn: "7d" });

    // response used by frontend
    return res.json({ userId: googleSub, token, email, name });
  } catch (err) {
    console.error("ID token verification failed:", err?.message || err);
    return res.status(401).json({ error: "Invalid ID token" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Auth server running on http://localhost:${PORT}`));
