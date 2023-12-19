let mealCard = document.getElementById("random-card");
let homeBtn = document.getElementById("home");
let searchInput = document.getElementById("search");
let searchBtn = document.getElementById("search-btn");
let userInput = document.getElementById("input");
let modal = document.getElementById("modal-1");
let ingredientList = document.getElementById("information");
let exitSpan = document.getElementsByClassName("exit")[0];
let categories = document.getElementsByClassName("category");
let resultOutput = document.getElementById("output");
let mealCards;
let selectedCategory;


async function fetchRandomMeal() {
  let mealData;
  await fetch("https://www.themealdb.com/api/json/v1/1/random.php")
    .then((data) => data.json())
    .then((e) => {
      mealData = e;
      // console.log(mealData)
    })
    .catch((error) => console.log(error));
  mealCard.innerHTML = `<div class="meal">
    <img class="meals" src=${mealData.meals[0].strMealThumb}>
    <h3>${mealData.meals[0].strMeal}</h3> </div>`;
  mealCard.addEventListener("click", (e) => {
    const parent = e.target.parentNode;
    const h3 = parent.getElementsByTagName("h3")[0];
    createIngredientList(h3.innerText);
  });
}


async function searchMeals(userInput, category) {
  if (category == "categ1") {
    await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${userInput}`)
      .then((data) => data.json())
      .then((e) => {
        if (e.meals != null) {
          displaySearchResults(e);
        } else {
          resultOutput.innerHTML = "";
          resultOutput.innerText = "Recipe Not found.";
        }
      });
  } else {
    //console.log(category)
  }
}


async function createIngredientList(mealName) {
  let list;
  await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${mealName}`)
    .then((data) => data.json())
    .then((e) => {
      list = e;
    });
    // console.log(list)
  ingredientList.innerHTML = "";

  for (let i = 1; i < 21; i++) {
    let ingredient = list.meals[0][`strIngredient${i}`];
    if (!ingredient) {
      break;
    }
    ingredientList.innerHTML +=` ${i}.${ingredient}<br>`;
  }
  modal.style.display = "block";
}


searchBtn.onclick = () => {
  let inputText = searchInput.value;
  if (selectedCategory == undefined) {

  } else if (inputText == "") {
    userInput.innerText = "Enter items in searchbar";
    resultOutput.innerHTML = "";
  } else {
    userInput.innerText = `Search Results for "${inputText}"`;
    searchMeals(inputText, selectedCategory);
  }
  // console.log("wevufvuv")
  // console.log(searchMeals)
};


function displaySearchResults(arrays) {
  resultOutput.innerHTML = "";
  arrays.meals.forEach((array) => {
    resultOutput.innerHTML += `<div class="meal">
      <img class="meals" src=${array.strMealThumb}>
      <h3>${array.strMeal}</h3> </div>`;
  });
  mealCards = document.querySelectorAll(".meal");
  setEventListeners();
  // console.l
}

// dom maniulation in js to show categories when we search
for (let i = 0; i < categories.length; i++) {
  categories[i].onclick = (e) => {
    for (let j = 0; j < categories.length; j++) {
      categories[j].style.color = "rgb(29, 26, 26)";
      categories[j].style.backgroundColor = "white";
    }
    categories[i].style.color = "white";
    categories[i].style.backgroundColor = "black";
    selectedCategory = e.target.id;
  };
  // console.log(selectedCategory)
}


function setEventListeners() {
  for (let i = 0; i < mealCards.length; i++) {
    const element = mealCards[i];
    element.onclick = (e) => {
      const parent = e.target.parentNode;
      const h3 = parent.getElementsByTagName("h3")[0];
      createIngredientList(h3.innerText);
    };
  }
}


exitSpan.onclick = function () {
  modal.style.display = "none";
};


homeBtn.onclick = () => {
  window.location = "index.html";
};


window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};


window.addEventListener("load", fetchRandomMeal);
