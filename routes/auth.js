require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const path = require("path");
const routeGuard = require("../middleware/verifytoken");

router.get("/secret", routeGuard, async (req, res) => {
  res.send("hello , this is a protected route");
});

router.get("/registerPage", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //hash the password
    const hashedpassword = await bcrypt.hash(password, 10); // how many times that we will hashing the password //1024

    const result = await pool.query(
      "INSERT INTO users (username,email, password) VALUES ($1, $2 , $3) RETURNING id ,username,email",
      [username, email, hashedpassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log("Error inserting ", error);
    if (error.code === "23505") {
      res.status(409).send("username or email already exist ");
    }
    res.status(500).send("Error");
  }
});

router.get("/loginPage", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 ",
      [email]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: "Email is not found" });

    //campare the enter password with the hashed password

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.send({ token });
  } catch (error) {
    console.log("Error logging in ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/profilePage", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/profile.html"));
});

router.get("/me", routeGuard, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/showAll", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/update", routeGuard, async (req, res) => {
  const { username, email, password } = req.body;
  const userId = req.user.id;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4",
        [username, email, hashedPassword, userId]
      );
    } else {
      await pool.query(
        "UPDATE users SET username = $1, email = $2 WHERE id = $3",
        [username, email, userId]
      );
    }

    res.send("User updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
});


module.exports = router;
