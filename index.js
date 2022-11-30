class Observer {
  #events;
  constructor() {
    this.#events = [];
  }

  on = (event, fn) => {
    this.#events.push({
      event,
      fn,
    });
  }

  emit = (event, ...data) => {
    const events = this.#events.filter(({ event: _event }) => _event == event);

    events.forEach(({ fn }) => fn(...data));
  }
}

/**
 * GENERAL
 */
const API_POSTS_URL = "https://jsonplaceholder.typicode.com/posts";
const API_USERS_URL = "https://jsonplaceholder.typicode.com/users";

const observer = new Observer();

const state = {
  posts: [],
  users: [],
  _data: [],
  data: [],
  limit: 10,
  page: 1,
  orderBy: "id ASC",
  pageInfo: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasPrevPage: false,
    hasNextPage: false,
  }
}

/**
 * DROPDOWN
 */
const $dropdown = document.querySelectorAll(".dropdown");
const $dropdownActions = document.querySelectorAll(".dropdownAction");

$dropdown.forEach($_dropdown => {
  const $dropdownActionButton = $_dropdown.querySelectorAll(".dropdownActionButton")[0];
  const $dropdownAction = $_dropdown.querySelectorAll(".dropdownAction")[0];
  const $dropdownValue = $_dropdown.querySelectorAll(".dropdownValue")[0];

  $dropdownActionButton.addEventListener("click", () => {
    if ($dropdownAction.classList.contains("hidden")) $dropdownActions.forEach($el => $el.classList.add("hidden"));

    $dropdownAction.classList.toggle("hidden");
  });

  $dropdownAction.querySelectorAll("a").forEach(($a) => {
    $a.addEventListener("click", (e) => {
      const { dataset: { value } } = e.target;
      const dropdownType = $dropdownActionButton.dataset.dropdownType;

      $dropdownValue.innerHTML = value;

      observer.emit("dropdownChange", { type: dropdownType, value });

      $dropdownAction.classList.add("hidden");
    });
  });
});

/**
 * TABLE
 */
$tableData = document.getElementById("tableData");

const TABLE_TR_HTML_TEMPLATE = ({ id, title, body, user: { name, email } }) => `
<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
  <td class="py-4 px-6">${id}</td>
  <td scope="row" class="flex items-center py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white">
    <div class="pl-3">
      <div class="text-base font-semibold">${name}</div>
      <div class="font-normal text-gray-500">${email}</div>
    </div>
  </td>
  <td class="py-4 px-6">${title}</td>
  <td class="py-4 px-6">${body}</td>
</tr>`;

/**
 * PAGES
 */
const $currentPage = document.getElementById("currentPage");
const $totalPages = document.getElementById("totalPages");
const $totalItems = document.getElementById("totalItems");
const $prevPage = document.getElementById("prevPage");
const $nextPage = document.getElementById("nextPage");

$prevPage.addEventListener("click", () => observer.emit("prevClick"));
$nextPage.addEventListener("click", () => observer.emit("nextClick"));

/**
 * CORE
 */

const _fetchPosts = async () => {
  try {
    const posts = await fetch(API_POSTS_URL);
    state.posts = await posts.json();
  } catch (err) {
    throw err;
  }
}

const _fetchUsers = async () => {
  try {
    const users = await fetch(API_USERS_URL);
    state.users = await users.json();
  } catch (err) {
    throw err;
  }
}

const _mapData = () => {
  state._data = state.posts.map(post => {
    const user = state.users.find(usr => usr.id == post.userId);

    const { userId, ...postInfo } = post;

    return { ...postInfo, user };
  });
}

const _fetchData = async () => {
  await _fetchPosts();
  await _fetchUsers();

  _mapData();
}

_populateDataAccordingToPageLimit = () => {
  state.pageInfo.currentPage = state.page;
  state.pageInfo.totalItems = state._data.length;
  state.pageInfo.totalPages = Math.floor(state.pageInfo.totalItems / state.limit);
  state.pageInfo.hasPrevPage = state.page > 1;
  state.pageInfo.hasNextPage = state.page < state.pageInfo.totalPages;

  const startIndex = state.limit * (state.page - 1);
  // page: 1; limit: 10 -> 0
  // page: 2; limit: 10 -> 10
  // page: 3; limit: 10 -> 20
  state.data = [...state._data].splice(startIndex, state.limit);
}

_populateDataAccordingToOrderBy = () => {
  switch (state.orderBy) {
    case "A-Z":
      state.data.sort((a, b) => a.title < b.title ? -1 : 0);
      break;
    case "Z-A":
      state.data.sort((a, b) => a.title > b.title ? 1 : 0);
      break;
    case "id ASC":
      state.data.sort((a, b) => a.id - b.id);
      break;
    case "id DESC":
      state.data.sort((a, b) => b.id - a.id);
      break;
    default:
      state.data.sort((a, b) => a.id - b.id);
      break;
  }
}

const _updateData = () => {
  _populateDataAccordingToPageLimit();
  _populateDataAccordingToOrderBy();
}

const _renderData = () => {
  const html = state.data.map(post => TABLE_TR_HTML_TEMPLATE(post)).join('');

  $tableData.innerHTML = html;
}

const _renderPage = () => {
  $currentPage.innerHTML = state.pageInfo.currentPage;
  $totalPages.innerHTML = state.pageInfo.totalPages
  $totalItems.innerHTML = state.pageInfo.totalItems;
  state.pageInfo.hasPrevPage ? $prevPage.removeAttribute("disabled") : $prevPage.setAttribute("disabled", true);
  state.pageInfo.hasNextPage ? $nextPage.removeAttribute("disabled") : $nextPage.setAttribute("disabled", true);
}

const render = () => {
  _renderData();
  _renderPage();
}

const refreshUI = () => {
  _updateData();
  render();
}

const init = async () => {
  await _fetchData()

  refreshUI();

  observer.on("dropdownChange", ({ type, value }) => {
    state[type] = isNaN(value) ? value : Number(value);
    console.log("dropdownChange")
    refreshUI();
  });

  observer.on("prevClick", () => {
    state.page = state.page - 1;
    console.log("prevClick")
    refreshUI();
  });

  observer.on("nextClick", () => {
    state.page = state.page + 1;
    console.log("nextClick")
    refreshUI();
  });
}

init();
