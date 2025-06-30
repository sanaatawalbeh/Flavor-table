// =================SEARCH====================
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

          const used =
            recipe.usedIngredients?.map((i) => i.name).join(", ") || "N/A";
          const missed =
            recipe.missedIngredients?.map((i) => i.name).join(", ") || "N/A";

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
    } catch (err) {
      alert("Failed to fetch recipes.");
    }
  });
}

// ===================RANDOM===================
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
        const recipeData = {
          title: data.title,
          image: data.image,
          instructions: data.instructions || "No instructions available.",
          ingredients: JSON.stringify(data.ingredients || []),
          readyin: data.readyInMinutes || 30,
        };

        axios
          .post("/recipes/insert", recipeData)
          .then(() => {
            alert(" Recipe saved to favorites and DataBase !");
          })

          .catch((error) => {
            alert(" Failed to save recipe.");
          });
      };
    } catch (err) {
      alert("Failed to fetch the recipe ");
    }
  });
}

// =================== sava to database ===================
async function saveToFavorites(recipe) {
  try {
    if (!recipe.id) {
      alert("Missing recipe ID.");
      return;
    }

    // 1) جلب التفاصيل من راوتك الخاص
    const res = await fetch(`/recipes/api/${recipe.id}/information`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server error ${res.status}: ${txt}`);
    }
    const fullData = await res.json();

    const recipeData = {
      title: fullData.title,
      image: fullData.image,
      instructions:
        fullData.analyzedInstructions?.[0]?.steps
          .map((s) => s.step)
          .join("\n") ||
        fullData.instructions ||
        "No instructions available.",
      ingredients: JSON.stringify(
        fullData.extendedIngredients?.map((i) => i.original) || []
      ),
      readyin: fullData.readyInMinutes || 30,
    };

    await axios.post("/recipes/insert", recipeData);
    alert("✅ Recipe saved with full details!");
  } catch (err) {
    console.error("❌ Error saving full recipe:", err);
    alert(`Failed to save recipe: ${err.message}`);
  }
  
}

// ===================display database in fav page ===================
async function loadFavorites() {
  const favContainer = document.getElementById("favoritesContainer");
  if (!favContainer) return;

  favContainer.innerHTML = "";

  try {
    const res = await fetch("/recipes/showAll");
    const favorites = await res.json();

    if (favorites.length === 0) {
      favContainer.innerHTML =
        "<p style='text-align:center;'>No favorites yet.</p>";
      return;
    }

    favorites.forEach((recipe) => {
      const card = document.createElement("div");
      card.className = "recipe-card-favorite";
      card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" />
      <h3>${recipe.title}</h3>
     <div class="card-content-scroll">
  <p><strong>Ingredients:</strong> ${
    Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(", ")
      : recipe.ingredients
  }</p>
  <p><strong>Instructions:</strong> ${
    recipe.instructions || "No instructions"
  }</p>
  <p><strong>Ready in:</strong> ${recipe.readyin} minutes</p>
</div>

      
      <div class="btn-group">
        <a href="/recipes/recp-details?id=${recipe.id}">
          <button class="main-btn">View</button>
        </a>
        <button class="main-btn update-btn" data-id="${
          recipe.id
        }">Update</button>
        <button class="main-btn delete-btn" data-id="${
          recipe.id
        }">Delete</button>
      </div>
    `;
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async () => {
        const id = deleteBtn.dataset.id;
        if (!confirm("Are you sure you want to delete this recipe?")) return;

        try {
          await fetch(`/recipes/delete/${id}`, { method: "DELETE" });
          alert("✅ Recipe deleted.");
          loadFavorites(); // تحديث القائمة بعد الحذف
        } catch (err) {
          console.error("❌ Error deleting recipe:", err);
          alert("Failed to delete recipe.");
        }
      });
      const updateBtn = card.querySelector(".update-btn");
      updateBtn.addEventListener("click", () => {
        openUpdateForm(recipe);
      });

      favContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading favorites:", err);
    favContainer.innerHTML = "<p>Failed to load favorites.</p>";
  }
}

//===================================================================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("update-btn")) {
    const recipeId = e.target.dataset.id;

    try {
      console.log("🔍 Recipe ID:", recipeId); // تأكد إنه رقم صحيح

      const res = await fetch(`/recipes/api/${recipeId}`);
      console.log("📦 Response Status:", res.status);
      const recipe = await res.json();

      // عبي البيانات الحقيقية
      document.getElementById("updateId").value = recipe.id;
      document.getElementById("updateTitle").value = recipe.title;
      document.getElementById("updateImage").value = recipe.image;
      document.getElementById("updateInstructions").value = recipe.instructions;

      let ingredientsStr;

      try {
        const parsed = JSON.parse(recipe.ingredients);
        ingredientsStr = parsed.join(", ");
      } catch (err) {
        ingredientsStr = recipe.ingredients; // استخدم النص كما هو إذا ما كان JSON
      }

      document.getElementById("updateIngredients").value = ingredientsStr;
      document.getElementById("updateReadyIn").value = recipe.readyin || 30;

      // فتح المودال
      document.getElementById("updateModal").classList.remove("hidden");
    } catch (err) {
      console.error("❌ Error loading recipe:", err);
      alert("Failed to load recipe data.");
    }
  }

  if (e.target.classList.contains("close")) {
    document.getElementById("updateModal").classList.add("hidden");
  }
});

document.getElementById("updateForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("updateId").value;
  const title = document.getElementById("updateTitle").value;
  const image = document.getElementById("updateImage").value;
  const instructions = document.getElementById("updateInstructions").value;
  const ingredients = document.getElementById("updateIngredients").value;
  const readyin = document.getElementById("updateReadyIn").value;

  fetch(`/recipes/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      image,
      instructions,
      ingredients: JSON.stringify(ingredients.split(",")),
      readyin: Number(readyin),
    }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("Recipe updated successfully!");
      document.getElementById("updateModal").classList.add("hidden");
      loadFavorites(); // حدث القائمة
    })
    .catch((err) => {
      console.error("Error updating:", err);
      alert("Failed to update recipe.");
    });
});

// =================== تحميل المفضلة عند التحميل ===================

window.addEventListener("DOMContentLoaded", () => {
  const isFavoritesPage = document.getElementById("favoritesContainer");
  if (isFavoritesPage) {
    loadFavorites();
    showSection?.("favoritesSection"); // اختياري حسب نظام الصفحات عندك
  }
});
