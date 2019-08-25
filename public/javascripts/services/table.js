import axios from "axios";

// TODO: frame the uri from location
const fieldsURI = "/games";

exports.getData = function(
  pageNumber,
  sortBy,
  sortType,
  groupBy,
  searchField,
  searchText,
  fieldsSeq
) {

    let queryString = "?";

  if (pageNumber && pageNumber > -1) {
    queryString += `pageNumber=${pageNumber}&`;
  }

  if (sortBy) {
    queryString += `sortBy=${sortBy}&`;
  }

  if (sortType) {
    queryString += `sortType=${sortType}&`;
  }

  if (groupBy) {
    queryString += `groupBy=${groupBy.join(",")}&`;
  }

  if (searchField && searchText) {
    queryString += `searchField=${searchField}&`;
    queryString += `searchText=${searchText}&`;
  }

  if (fieldsSeq) {
    queryString += `fieldsSeq=${fieldsSeq}`;
  }

  return axios.get(`${fieldsURI}${queryString}`);
};
