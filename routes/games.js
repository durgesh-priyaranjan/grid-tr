var express = require('express');
var _ = require("lodash");
var mock = require("../public/data/mock");

var router = express.Router();

function getPaginatedItems(items, page, pageSize) {
  var pg = page || 1,
    pgSize = pageSize || 30,
    offset = (pg - 1) * pgSize,
    pagedItems = _.drop(items, offset).slice(0, pgSize);
  return {
    page: pg,
    pageSize: pgSize,
    total: items.length,
    total_pages: Math.ceil(items.length / pgSize),
    data: pagedItems
  };
}

function getPaginatedItemsFromObject(items, page, pageSize) {
  var pg = page || 1,
  pgSize = pageSize || 30,
  offset = (pg - 1) * pgSize;
  
  var keys = Object.keys(items);
  var pagedItems = _.forEach(items, function(item, key) {
    var index = keys.indexOf(key);
    if ( ! ((index > offset) && (index <= offset + pgSize)) ) {
      delete items[key];
    }
  });
  
  // _.filter(items, function(item, key) {
  //   var index = keys.indexOf(key);
  //   return (index > offset) && (index < offset + pgSize)
  // });

  return {
    page: pg,
    pageSize: pgSize,
    total: items.length,
    total_pages: Math.ceil(keys.length / pgSize),
    data: items
  };
}

function getSortedData(data, sortBy, sortType) {
  return _.orderBy(data, sortBy, sortType);
}

function groupData(data, groupFields, fieldsSeq) {
  const fields = [];
  fieldsSeq.forEach(element => {
    if (groupFields.indexOf(element) > -1) {
      fields.push(element);
    }
  });

  function recurse(pointer, current, acc) {
    var nextKey = fields[current];

    if (!nextKey) return acc;
    var allKeys = Object.keys(pointer);

    allKeys.forEach(function(key) {
      var temp = _.groupBy(pointer[key], nextKey);
      var nextCurrent = current + 1;
      pointer[key] = temp;
      recurse(temp, nextCurrent, acc);
    });

    return acc;
  }

  var initialData = _.groupBy(data, fields.shift());
  var finalData = recurse(initialData, 0, initialData);

  return finalData;
}

router.get('/', function(req, res, next) {
  const queries = req.query;
  const pageNumber = parseInt(queries.pageNumber) || 1;
  const sortBy = queries.sortBy;
  const sortType = queries.sortType || 'asc';
  const groupBy = queries.groupBy;
  const fieldsSeq = queries.fieldsSeq;
  const searchText = queries.searchText;
  const searchField = queries.searchField;

  if(groupBy && groupBy.split(",").length > 0){
    const groupedData = groupData(mock.data, groupBy.split(","), fieldsSeq.split(","));

    res.send(getPaginatedItemsFromObject(groupedData, pageNumber));
  } else {
    let sortedData = sortBy ? getSortedData(mock.data, sortBy, sortType) : mock.data;

    if (searchText && searchField) {
      sortedData = _.filter(sortedData, o => {
        return String(o[searchField]).includes(searchText);
      });
    }

    res.send(getPaginatedItems(sortedData, pageNumber));  
  }
});

module.exports = router;
