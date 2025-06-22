// =================== search ===================
const searchBtn = document.getElementById("searchPageBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

if (searchBtn && searchInput && searchResults) {
  searchBtn.addEventListener("click", async () => {
    const ingredients = searchInput.value.trim();
    if (!ingredients) {
      alert("Please enter ingredients!");
      return;
    }

    try {
      const res = await fetch(
        `/recipes/api/by-ingredients?ingredients=${encodeURIComponent(
          ingredients
        )}`
      );
      const data = await res.json();

      searchResults.innerHTML = "";

      if (data.length === 0) {
        searchResults.innerHTML = "<p>No recipes found.</p>";
      } else {
        data.forEach((recipe) => {
          const card = document.createElement("div");
          card.className = "recipe-card-small";

          const used = recipe.usedIngredients
            ? recipe.usedIngredients.map((i) => i.name).join(", ")
            : "N/A";
          const missed = recipe.missedIngredients
            ? recipe.missedIngredients.map((i) => i.name).join(", ")
            : "N/A";

          card.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" />
            <h3>${recipe.title}</h3>
            <p><strong class="used">Used Ingredients:</strong> ${used}</p>
            <p><strong class="missed">Missing Ingredients:</strong> ${missed}</p>
            <div class="btn-group">
<a href="/recipes/recp-details?id=${recipe.id}">
  <button class="main-btn">View Recipe</button>
</a>
              <button class="main-btn save-fav-btn">Save to Favorites</button>
            </div>
          `;

          const saveBtn = card.querySelector(".save-fav-btn");
          saveBtn.addEventListener("click", () => {
            saveToFavorites(recipe);
          });

          searchResults.appendChild(card);
        });
      }

      // searchResults.style.display = "grid";
    } catch (err) {
      console.error("Error fetching recipes:", err);
      alert("Failed to fetch recipes.");
    }
  });
}

// =================== random ===================
const btn = document.getElementById("getRecipeBtn");
const display = document.getElementById("recipeDisplay");
const title = document.getElementById("recipeTitle");
const img = document.getElementById("recipeImage");
const ingredients = document.getElementById("recipeIngredients");
const instructions = document.getElementById("recipeInstructions");
const saveBtn = document.getElementById("saveRandomBtn");

if (btn && display && title && img && ingredients && instructions) {
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch("/recipes/api/random");
      const data = await res.json();

      title.textContent = data.title;
      img.src = data.image;
      ingredients.innerHTML = "";
      data.ingredients.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ingredients.appendChild(li);
      });
      instructions.innerHTML =
        data.instructions || "No instructions available.";
      display.style.display = "block";

      saveBtn.onclick = () => {
        saveToFavorites({
          id: data.id || Date.now(),
          title: data.title,
          image: data.image,
          instructions: data.instructions,
          ingredients: data.ingredients,
          summary: data.summary || "No summary available.",
          readyInMinutes: data.readyInMinutes || "N/A",
        });
      };
    } catch (err) {
      alert("Failed to fetch the recipe 😢");
    }
  });
}

// =================== المفضلة ===================
const favBtn = document.getElementById("favoritesBtn");
const favSection = document.getElementById("favoritesSection");

if (favBtn && favSection) {
  favBtn.addEventListener("click", () => {
    displayFavorites();
    showSection("favoritesSection");
  });
}

function saveToFavorites(recipe) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.some((fav) => fav.id === recipe.id)) {
    alert("Recipe already in favorites!");
    return;
  }

  favorites.push(recipe);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  alert("Recipe saved to favorites!");
}

function displayFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const container = document.getElementById("favoritesSection");
  container.innerHTML = "";

  if (favorites.length === 0) {
    container.innerHTML = "<p>No favorites yet.</p>";
    return;
  }

  favorites.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${recipe.title}</h3>
      <img src="${recipe.image}" alt="${recipe.title}" />
      <p>${recipe.instructions || "No instructions"}</p>
      <button class="remove-fav-btn">Remove</button>
    `;

    const removeBtn = card.querySelector(".remove-fav-btn");
    removeBtn.addEventListener("click", () => {
      removeFavorite(recipe.id);
      displayFavorites();
    });

    container.appendChild(card);
  });
}

function removeFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter((recipe) => recipe.id !== id);
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// =================== التنقل بين الأقسام ===================
function showSection(sectionId) {
  const sections = [
    "homeSection",
    "searchSection",
    "randomSection",
    "favoritesSection",
  ];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === sectionId ? "block" : "none";
    }
  });
}

// =================== المفضلة ===================

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  const container = document.getElementById("favoritesContainer");
  container.innerHTML = "";

  if (favorites.length === 0) {
    container.innerHTML = "<p style='text-align:center;'>No favorites yet.</p>";
    return;
  }

  favorites.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card-small";
    card.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}" />
    <h3>${recipe.title}</h3>
    <div class="btn-group">
      <a href="/recipes/recp-details?id=${recipe.id}">
        <button class="main-btn">View</button>
      </a>
      <button class="main-btn remove-btn">Remove</button>
    </div>
  `;

    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      removeFavorite(recipe.id);
      loadFavorites(); // reload بعد الحذف
    });

    container.appendChild(card);
  });
}

function removeFavorite(recipeId) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter((r) => r.id !== recipeId);
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// تحميل القائمة عند فتح الصفحة
window.addEventListener("DOMContentLoaded", loadFavorites);
