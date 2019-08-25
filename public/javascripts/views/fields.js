import { getFields } from "../services/fields";
import { constants } from "../eventNames";

const qs = document.querySelector.bind(document);
const qsa = document.querySelectorAll.bind(document);

// Render fields selector
const fieldsContainer = qs("#fieldsContainer");
const checkboxSelector = 'input[type="checkbox"]';
const event = new Event(constants.fieldsConfigChange);

function fieldsMarkup(field) {
  return `
        <div class="col-md field-item" draggable="true">
            <input class="form-check-input" type="checkbox" checked value="" id="${field.name}" label="${field.label}" data-cansearchon="${field.canSearchOn}" data-cansorton="${field.canSortOn}" data-cangroupon="${field.canGroupOn}">
            <label class="form-check-label" for="${field.name}">${field.label}</label>
        </div>
    `;
}

let elementInMove;

function dragStart(ev) {
  elementInMove = ev.target;
  ev.dataTransfer.dropEffect = "move";
}

function dragOver(ev) {
  ev.currentTarget.style.background = "lightblue";
  ev.preventDefault();
}

function dragLeave(ev) {
  ev.currentTarget.style.background = "transparent";
}

function dragDrop(ev) {
  ev.preventDefault();
  ev.currentTarget.style.background = "transparent";
  ev.currentTarget.insertAdjacentElement("beforebegin", elementInMove);
}

function dragEnd(ev) {
  ev.currentTarget.style.background = "transparent";
  document.body.dispatchEvent(event);
}

function bindEvents() {
  fieldsContainer.querySelectorAll(".field-item").forEach(el => {
    el.addEventListener("dragstart", dragStart, false);
    el.addEventListener("dragover", dragOver, false);
    el.addEventListener("dragleave", dragLeave, false);
    el.addEventListener("drop", dragDrop, false);
    el.addEventListener("dragend", dragEnd, false);
  });

  fieldsContainer.addEventListener("click", e => {
    const target = e.target;
    if (target.nodeName === "INPUT" || target.nodeName === "LABEL") {
      document.body.dispatchEvent(event);
    }
  });
}

(async function() {
  try {
    const fields = await getFields();
    const html = fields.data.fields.reduce((acc, val) => {
      return acc + fieldsMarkup(val);
    }, "");
    fieldsContainer.innerHTML = html;
    bindEvents();
    document.body.dispatchEvent(event);
  } catch (e) {
    console.error("Could not render fields");
    console.error(e);
  }
})();

exports.getFieldsDetails = function() {
  return Array.from(fieldsContainer.querySelectorAll(checkboxSelector)).reduce(
    (acc, element) => {
      if (element.checked)
        acc.push({
          id: element.id,
          label: element.getAttribute("label"),
          canGroupOn: element.dataset.cangroupon === "true",
          canSortOn: element.dataset.cansorton === "true",
          canSearchOn: element.dataset.cansearchon === "true"
        });
      return acc;
    },
    []
  );
};
