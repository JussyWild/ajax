const SUGGESTS_COUNT = 10;

window.addEventListener("load", autocomplete);
window.addEventListener("load", showLastSearches);
window.addEventListener("storage", showLastSearches);

function showLastSearches() {
    const inp = document.getElementById("input_id");
    const lastSearches = document.getElementById("last-searches_id");
    let values = localStorage.getItem("last_searches");

    if (!values) return;
    values = JSON.parse(values).slice(-3);
    lastSearches.innerHTML = "";

    for(let val of values.reverse()) {
        const divContent = val['original_title'].trim().toLowerCase();
        const div = document.createElement("div");
        div.setAttribute("class", "last-searches__item");
        div.innerHTML = divContent;
        div.innerHTML += `<input type='hidden' value='${divContent}'>`;
        div.addEventListener("click", function(e) {
            inp.value = this.getElementsByTagName("input")[0].value;
            showFilmCard(val);
        });

        lastSearches.appendChild(div);
    }
}

function submitHandler() {
    const filmCard = document.getElementById("film-card_id");
    filmCard.style.display = 'none';
    while (filmCard.firstChild) {
        filmCard.removeChild(filmCard.firstChild);
    }

    const inp = document.getElementById('input_id');
    let lastSearches = localStorage.getItem("last_searches");
    const val = inp['active'];
    inp.value = null;

    if (!val) return;

    if (!lastSearches) {
        lastSearches = [];
    } else {
        lastSearches = JSON.parse(lastSearches).filter(i => i['id'] !== val['id']);

        if (lastSearches.length === 5) lastSearches.shift();
    }

    lastSearches.push(val);
    localStorage.setItem("last_searches", JSON.stringify(lastSearches));
    showLastSearches();
}

function showFilmCard(film) {
    const filmCard = document.getElementById("film-card_id");

    const title = document.createElement("h2");
    title.innerHTML = "Film card";

    const filmTitle = document.createElement("div");
    filmTitle.setAttribute("class", "film-card__title");
    filmTitle.innerHTML = film['original_title'];

    const filmDescription = document.createElement("div");
    filmDescription.setAttribute("class", "film-card__overview");
    filmDescription.innerHTML = film['overview'];

    const filmStats = document.createElement("div");
    filmStats.setAttribute("class", "film-card__stats");
    filmStats.innerHTML = `Vote average: ${film['vote_average']} Vote count: ${film['vote_count']}`;

    filmCard.appendChild(title);
    filmCard.appendChild(filmTitle);
    filmCard.appendChild(filmDescription);
    filmCard.appendChild(filmStats);

    filmCard.style.display = 'flex';
}

async function autocomplete() {
    const url = new URL("https://api.themoviedb.org/3/search/movie");
    const api_key = "90517e554b8a368c34d09d60f9ef41b7";

    const inp = document.getElementById("input_id");
    let currentFocus;

    inp.addEventListener("input", async function(e) {
        const val = e.target.value.trim().toLowerCase();
        if (!val) return;

        closeSuggests();
        currentFocus = -1;

        let itemsLocal = localStorage.getItem("last_searches");
        itemsLocal = itemsLocal ? JSON.parse(itemsLocal).reverse() : [];

        const itemsCount = SUGGESTS_COUNT - itemsLocal.length;
        url.search = new URLSearchParams({ query: `"${val}"`, api_key }).toString();

        let items = [];
        try {
            const resp = await fetch(url);
            if (!resp.ok) return;
            const data = await resp.json();

            const itemsApi = data.results.slice(0, itemsCount);
            items = [...itemsLocal, ...itemsApi];
        } catch (err) {
            console.log(err);
            return;
        }

        const suggestsList = document.createElement("div");
        suggestsList.setAttribute("id", "suggests_id");
        suggestsList.setAttribute("class", "suggests");
        inp.parentNode.appendChild(suggestsList);

        for (const item of items) {
            const suggestContent = item['original_title'].trim().toLowerCase();
            const suggest = document.createElement("div");
            suggest.setAttribute("class", "suggests__item");
            suggest.innerHTML = `<strong>${suggestContent}</strong>`;
            suggest.innerHTML += `<input type='hidden' value='${suggestContent}'>`;

            suggest.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;
                inp['active'] = item;
                closeSuggests();
                showFilmCard(item);
            });
            suggestsList.appendChild(suggest);
        }
    });

    inp.addEventListener("keydown", function(e) {
        const suggestsList = document.getElementById("suggests_id");
        if (!suggestsList) return;

        const suggests = suggestsList.getElementsByClassName("suggests__item");

        switch (e.key) {
            case "Down":
            case "ArrowDown":
                e.preventDefault();
                currentFocus++;
                addActive(suggests);
                break;
            case "Up":
            case "ArrowUp":
                e.preventDefault();
                currentFocus--;
                addActive(suggests);
                break;
            case "Enter":
                e.preventDefault();
                if (currentFocus > -1) {
                    if (suggests) suggests[currentFocus].click();
                }
                break;
            case "Esc":
            case "Escape":
                e.preventDefault();
                closeSuggests()
                break;
        }
    });

    function addActive(suggests) {
        if (!suggests) return;
        removeActive(suggests);

        if (currentFocus >= suggests.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = suggests.length - 1;

        suggests[currentFocus].classList.add("suggest__item_active");
    }

    function removeActive(suggests) {
        for (const suggest of suggests) {
            suggest.classList.remove("suggest__item_active");
        }
    }

    function closeSuggests() {
        currentFocus = -1;
        const suggestsList = document.getElementById("suggests_id");
        if (suggestsList) suggestsList.parentNode.removeChild(suggestsList);
    }

    document.addEventListener("click", function (e) {
        closeSuggests();
    });
}
