import axios from "axios";

// TODO: frame the uri from location
const fieldsURI = "/fields.json";

exports.getFields = function() {
  return axios.get(fieldsURI);
};
