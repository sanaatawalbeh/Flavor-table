require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();
const apiKey = process.env.SPOONACULAR_API_KEY;
const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

//to protuct some routes
const routeGuard = require("../middleware/verifytoken");

//search page routes
router.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/search.html"));
});

router.get("/api/by-ingredients", async (req, res) => {
  const ingredients = req.query.ingredients;
  if (!ingredients)
    return res.status(400).json({ error: "Ingredients query is required" });

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/findByIngredients`,
      {
        params: {
          apiKey,
          ingredients,
          number: 12,
        },
      }
    );

    const recipes = response.data.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients,
      missedIngredients: recipe.missedIngredients,
    
    }));

    res.json(recipes);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

//random page routes
router.get("/random", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/randomrecipe.html"));
});

router.get("/api/random", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/random`,
      {
        params: { apiKey },
      }
    );
    const recipe = response.data.recipes[0];
    res.json({
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map((i) => i.original),
      summary: recipe.summary,
      readyInMinutes: recipe.readyInMinutes,
      id: recipe.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random recipe" });
  }
});

//fav page router
router.get("/favorites", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/favorites.html"));
});

//details page router
router.get("/recp-details", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/recipe-details.html"));
});
//get the details for specific recipe depend on its id to be shown in details page
router.get("/api/:id/information", async (req, res) => {
  const recipeId = req.params.id;

  try {
    const apiRes = await axios.get(
      `https://api.spoonacular.com/recipes/${recipeId}/information`,
      {
        params: { apiKey },
      }
    );
    res.json(apiRes.data);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});

//----------------------------------------------------------------------
//CRUD Database operations
//INSERT operation
router.post("/insert", async (req, res) => {
  console.log("Received data:", req.body); // <-- سجل البيانات اللي جتك

  const { title, image, instructions, ingredients, readyin } = req.body;

  try {
    await pool.query(
      "INSERT INTO recipes (title, image, instructions, ingredients, readyin) VALUES ($1, $2, $3, $4, $5)",
      [title, image, instructions, ingredients, readyin]
    );

    res.status(201).json({ message: "Recipe saved to DB!" });
  } catch (err) {
    console.error("DB Insert Error:", err);
    res.status(500).json({ error: "Database insert failed." });
  }
});

//SELECT ALL
router.get("/showAll", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM recipes WHERE id = $1", [id]);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//UPDATE
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, instructions, ingredients, readyin } = req.body;
    await pool.query(
      "UPDATE recipes SET title=$1, image=$2, instructions=$3, ingredients=$4, readyin=$5 WHERE id=$6",
      [title, image, instructions, ingredients, readyin, id]
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//SELECT A SPECIFIC RECIPE FROM DATABASE
router.get("/api/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [
      recipeId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /recipes/api/:id/information
router.get("/api/:id/information", async (req, res) => {
  const { id } = req.params;
  try {
    const apiRes = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      { params: { apiKey: process.env.SPOONACULAR_API_KEY } }
    );
    res.json(apiRes.data);
  } catch (err) {
    console.error("Error fetching recipe details:", err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});



module.exports = router;
