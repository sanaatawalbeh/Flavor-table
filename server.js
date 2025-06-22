require("dotenv").config();
const apiKey = process.env.SPOONACULAR_API_KEY;
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const homeRouter = require("./routes/home");
const recipesRouter = require("./routes/recipe");

app.use("/", homeRouter);
app.use("/recipes", recipesRouter);

app.use((req, res) => {
  res.status(404).send('Page not found <a href="/"> Get back home</a>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});