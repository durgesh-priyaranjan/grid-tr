import { tableState } from "./table";
import { uniq } from "lodash";

const modalInstance = document.querySelector("#modalCenter");
const userSelectX = `
    <option value="difficultyLevel" selected>Difficulty Level</option>
    <option value="game">Game Id</option>
    <option value="score">Score</option>
    <option value="time">Time</option>
`;
const userSelectY = `
    <option value="score" selected>Score</option>
    <option value="time">Time</option>
`;

exports.renderGrouped = function(head, data) {
  var groupBy = tableState.aggregateBy;

  function getNestedMarkup(pointer, key) {
    if (Array.isArray(pointer)) {
      let html = "";
      let count = pointer.length;

      pointer.forEach(item => {
        html += `<tr key="${key}">`;

        head.forEach(col => {
          if (groupBy.indexOf(col.id) === -1) {
            html += `<td>${item[col.id]}</td>`;
          }
        });

        html += "</tr>";
      });

      return { html, count };
    } else {
      let keys = Object.keys(pointer);
      let html = "";
      keys.forEach(k => {
        let data = getNestedMarkup(pointer[k], k);
        html += `<tr key="${k}">`;
        html += `<td rowspan="${data.count + 1}"> ${k} </td>`;
        html += `</tr>`;
        html += data.html;
      });
      return html;
    }
  }

  return getNestedMarkup(data);
};

var gkey;
var gdata;
var gconf = {};
function showUserSummary(data, key) {
  gkey = key;
  gdata = data;
  let games = data.map(i => i["game"]);
  let difficultyLevel = data.map(i => i["difficultyLevel"]);
  let scores = data.map(i => i["score"]);
  let lowestScore = Math.min(...scores);
  let highestScore = Math.max(...scores);

  gconf.game = uniq(games);
  gconf.difficultyLevel = uniq(difficultyLevel);
  gconf.score = uniq(scores);

  let html = `
        <dl>
            <dt>User: ${key}</dt>
            <dd>Played Games: ${games.join(", ")}</dd>
            <dd>At levels: ${difficultyLevel.join(", ")}</dd>
            <dd>Scores: ${scores.join(", ")}</dd>
            <dd>Lowest Score: ${lowestScore}</dd>
            <dd>Highest Score: ${highestScore}</dd>
        </dl>
    `;

  modalInstance.querySelector(".modal-body .summary").innerHTML = html;
  modalInstance.querySelector(".modal-body #chart").innerHTML = `
        <div class="total-game"></div>
        <div class="total-difficultyLevel"></div>
        <div class="total-score"></div>
    `;

  modalInstance.querySelector(
    ".modal-body .custom-select.x"
  ).innerHTML = userSelectX;
  modalInstance.querySelector(
    ".modal-body .custom-select.y"
  ).innerHTML = userSelectY;

  $(modalInstance).modal();
}

function showGameSummary(data) {
  console.log(data);
}

$(modalInstance).on("shown.bs.modal", function(e) {
  var keys = Object.keys(gconf);
  keys.forEach(k => {
    var chart = new ApexCharts(document.querySelector(`.total-${k}`), {
      chart: { type: "donut" },
      series: gconf[k].map(i => 100 / gconf[k].length),
      dataLabels: {
        enabled: true,
        formatter: function(val, options) {
          return gconf[k][options.seriesIndex];
        }
      },
      legend: {
        show: false
      },
      title: {
        text: k
      }
    });
    chart.render();
  });

  customChart(gkey, gdata, gconf);
});

var chart;
function customChart(key, data, conf) {
  const xAxis = document.querySelector(".custom-select.x").value;
  const yAxis = document.querySelector(".custom-select.y").value;

  var yData = [];
  var xData = [];

  data.forEach(item => {
    yData.push(item[yAxis]);
    xData.push(item[xAxis]);
  });

  var options = {
    chart: {
      height: 350,
      type: "bar"
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        distributed: true
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [
      {
        data: yData
      }
    ],
    xaxis: {
      categories: xData,
      labels: {
        style: {
          fontSize: "14px"
        }
      }
    }
  };

  if (chart) chart.destroy();
  document.querySelector("#customcart").innerHTML = "";
  chart = new ApexCharts(document.querySelector("#customcart"), options);
  chart.render();
}

$(modalInstance).on("hide.bs.modal", function(e) {
  gkey = undefined;
  gdata = undefined;
  gconf = {};
});

document.body.addEventListener("change", function(e) {
  const target = e.target;
  if (target.classList.contains("custom-select")) {
    customChart(gkey, gdata, gconf);
  }
});

exports.showSummary = function(key) {
  if (tableState.aggregateBy[0] === "username") {
    showUserSummary(tableState.data[key], key);
  }

  if (tableState.aggregateBy[0] === "game") {
    showUserSummary(tableState.data[key], key);
  }
};
