import { getData } from "../services/table";
import { constants } from "../eventNames";
import { renderGrouped, showSummary } from "./grouped";

const qs = document.querySelector.bind(document);
const qsa = document.querySelectorAll.bind(document);

const event = new Event(constants.tableConfigChanged);

const tableContainer = qs("#tableContainer > table");
const paginationContainer = qs("#tableContainer > .pagination");

const state = {
  totalPage: 1,
  _pageNumber: 1,
  set pageNumber(pn = 1) {
    this._pageNumber = pn;
    document.body.dispatchEvent(event);
  },
  get pageNumber() {
    return this._pageNumber;
  },
  _sortBy: null,
  set sortBy(col) {
    this._sortBy = col;
    document.body.dispatchEvent(event);
  },
  get sortBy() {
    return this._sortBy;
  },
  _sortType: null,
  set sortType(val) {
    this._sortType = val;
  },
  get sortType() {
    return this._sortType;
  },
  _aggregateBy: [],
  set aggregateBy(col) {
    if (!col) this._aggregateBy = [];

    if (this._aggregateBy.indexOf(col) < 0) {
      this._aggregateBy = [col];
      document.body.dispatchEvent(event);
    }
  },
  get aggregateBy() {
    return this._aggregateBy;
  },
  _searchField: null,
  set searchField(col) {
    this._searchField = col;
  },
  get searchField() {
    return this._searchField;
  },
  _searchText: null,
  set searchText(col) {
    this._searchText = col;
    document.body.dispatchEvent(event);
  },
  get searchText() {
    return this._searchText;
  }
};

function headMarkup(fields) {
  const th = fields.reduce((acc, f) => {
    acc += `<th name="${f.id}">${f.label} <br/>`;

    var isSortByActive = f.id === state.sortBy;
    var isAsc, isDesc;
    if (isSortByActive) {
      if (state.sortType === "asc") isAsc = true;
      if (state.sortType === "desc") isDesc = true;
    }

    if (f.canSortOn) {
      acc += `<button class="btn btn-sm btn-outline-secondary sort ${
        isDesc ? "active" : ""
      }" type="desc">↓</button>`;
      acc += `<button class="btn btn-sm btn-outline-secondary sort ${
        isAsc ? "active" : ""
      }" type="asc">↑</button>`;
    }

    if (f.canGroupOn && f.id === fields[0].id) {
      let isActive = false;
      if (state.aggregateBy[0] === f.id) {
        isActive = true;
      }
      acc += `<button class="btn btn-sm btn-outline-secondary group ${
        isActive ? "active" : ""
      }">+</button>`;
    }

    if (f.canSearchOn) {
      let val = state.searchField === f.id ? state.searchText : "";
      acc += `<input type="text" value="${val}">`;
    }

    acc += `</th>`;

    return acc;
  }, "");

  return `
        <thead>
            <tr>
                ${th}
            </tr>
        </thead>
    `;
}

function bodyMarkUp(bodyData) {
  if (!bodyData) return `<tbody>Loading...</tbody>`;

  const body = "";
  return `<tbody>${body}</tbody>`;
}

function buildRows(headData, tableData) {
  var columnNames = headData.map(i => i.id);
  let rows = "";

  tableData.forEach(d => {
    let columns = headData.reduce((acc, curr) => {
      acc += `<td>${d[curr.id]}</td>`;
      return acc;
    }, "");

    rows += `
            <tr>${columns}</tr>
        `;
  });

  return rows;
}

function renderPaginator() {
  let html = "";

  if (state.pageNumber > 1) {
    html += `<li class="page-item">
              <a class="page-link" href="#" data-page="1"><<</a>
          </li>`;
  } else {
    html += `<li class="page-item disabled">
              <a class="page-link" href="#" data-page="1"><<</a>
          </li>`;
  }

  if (state.pageNumber > 1) {
    html += `<li class="page-item">
              <a class="page-link" href="#" data-page="${state.pageNumber -
                1}"><</a>
          </li>`;
  } else {
    html += `<li class="page-item disabled">
              <a class="page-link" href="#" data-page="${state.pageNumber -
                1}"><</a>
          </li>`;
  }

  html += `<li class="page-item active">
              <a class="page-link" href="#" data-page="${state.pageNumber}">${state.pageNumber}</a>
          </li>`;

  if (state.pageNumber < state.totalPage) {
    html += `<li class="page-item">
          <a class="page-link" href="#" data-page="${state.pageNumber +
            1}">></a>
      </li>
      <li class="page-item">
          <a class="page-link" href="#" data-page="${state.totalPage}">>></a>
      </li>`;
  } else {
    html += `<li class="page-item disabled">
          <a class="page-link" href="#" data-page="${state.pageNumber +
            1}">></a>
      </li>
      <li class="page-item disabled">
          <a class="page-link" href="#" data-page="${state.totalPage}">>></a>
      </li>`;
  }

  paginationContainer.innerHTML = html;
}

async function fetchAndRenderBody(
  headData,
  headHTML,
  {
    pageNumber = 1,
    sortBy,
    sortType = "asc",
    aggregateBy,
    searchField,
    searchText
  } = {},
  fieldsSeq
) {
  const data = await getData(
    pageNumber,
    sortBy,
    sortType,
    aggregateBy,
    searchField,
    searchText,
    fieldsSeq
  );
  state.totalPage = data.data.total_pages;
  state.data = data.data.data;

  let bodyMarkup;
  if (Array.isArray(data.data.data)) {
    bodyMarkup = buildRows(headData, data.data.data);
  } else {
    bodyMarkup = renderGrouped(headData, data.data.data);
  }

  tableContainer.innerHTML = headHTML + bodyMarkup;
  renderPaginator();
}

exports.renderTable = function(headData, pageConfig, fieldsSeq) {
  const headHTML = headMarkup(headData);
  tableContainer.innerHTML = headHTML + bodyMarkUp();
  fetchAndRenderBody(headData, headHTML, pageConfig, fieldsSeq.join(","));
};

(function init() {
  paginationContainer.addEventListener("click", function(e) {
    const target = e.target;
    if (target.nodeName === "A") {
      e.preventDefault();
      state.pageNumber = parseInt(target.dataset.page);
    }
  });

  tableContainer.addEventListener("click", function(e) {
    const target = e.target;

    if (target.classList.contains("sort")) {
      let col = target.closest("th").getAttribute("name");
      let sortType = target.getAttribute("type");
      state.sortType = sortType;
      state.sortBy = col;
    }

    if (target.classList.contains("group")) {
      let col = target.closest("th").getAttribute("name");
      state.aggregateBy = col;
    }

    if (target.closest("tr")) {
      const row = target.closest("tr");
      const key = row.getAttribute("key");
      if (key) showSummary(key);
    }
  });

  tableContainer.addEventListener("keyup", function(e) {
    const target = e.target;
    if (target.nodeName === "INPUT" && e.keyCode === 13) {
      let col = target.closest("th").getAttribute("name");
      let val = target.value;

      state.searchField = col;
      state.searchText = val;
    }
  });
})();

exports.tableState = state;
