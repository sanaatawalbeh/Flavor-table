require("dotenv").config();
const apiKey = process.env.SPOONACULAR_API_KEY;
const express = require("express");
const cors = require("cors");
const app = express();

const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });


app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const homeRouter = require("./routes/home");
const recipesRouter = require("./routes/recipe");

app.use("/", homeRouter);
app.use("/recipes", recipesRouter);

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

// -----------------------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send('Page not found <a href="/"> Get back home</a>');
});