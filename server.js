require("dotenv").config();
const apiKey = process.env.SPOONACULAR_API_KEY;
const express = require("express");
const cors = require("cors");
const app = express();

const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const jwt = require("jsonwebtoken");



app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const homeRouter = require("./routes/home");
const recipesRouter = require("./routes/recipe");
const auth = require("./routes/auth");

app.use("/", homeRouter);
app.use("/recipes", recipesRouter);
app.use("/user", auth);


// -----------------------------------------------------------------------------------------------
const port = process.env.PORT || 3000;

pool
  .connect()
  .then((client) => {
    return client
      .query("SELECT current_database(), current_user")
      .then((res) => {
        client.release();

        const dbName = res.rows[0].current_database;
        const dbUser = res.rows[0].current_user;

        console.log(
          `Connected to PostgreSQL as user '${dbUser}' on database '${dbName}'`
        );

        console.log(`App listening on port http://localhost:${port}`);
      });
  })
  .then(() => {
    app.listen(port);
  })
  .catch((err) => {
    console.error("Could not connect to database:", err);
  });

  app.get("/user/me", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, env.process.JWT_SECRET); // بدّل SECRET_KEY بالمفتاح الحقيقي
      res.json({
        username: decoded.username,
        email: decoded.email || "test@example.com",
      });
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
  });
// -----------------------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send('Page not found <a href="/"> Get back home</a>');
});
