import "@babel/polyfill";
import { constants } from "./eventNames";
import { getFieldsDetails } from "./views/fields";
import { renderTable, tableState } from "./views/table";

function updateView() {
  renderTable(
    getFieldsDetails(),
    tableState,
    getFieldsDetails().map(f => f.id)
  );
}

document.body.addEventListener(constants.fieldsConfigChange, function() {
  tableState.aggregateBy = null;
  updateView();
});

document.body.addEventListener(constants.tableConfigChanged, updateView);
