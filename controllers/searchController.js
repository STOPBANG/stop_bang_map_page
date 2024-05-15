const db = require("../config/db");
const searchModel = require("../models/searchModel");
const jwt = require("jsonwebtoken");
const {httpRequest} = require('../utils/httpRequest');
const fetch = require('node-fetch');
async function fetchAllData(sgg_nm, bjdong_nm, cmp_nm = null) {
  let start = 1;
  let count = 1000;
  let hasMoreData = true;
  let allFiltered = [];

  while (hasMoreData) {
    const apiUrl = `http://openapi.seoul.go.kr:8088/${process.env.API_KEY}/json/landBizInfo/${start}/${start + count - 1}/`;
    try {
      const apiResponse = await fetch(apiUrl);
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! Status: ${apiResponse.status}`);
      }
      const js = await apiResponse.json();

      if (js.landBizInfo && js.landBizInfo.row) {
        const rows = js.landBizInfo.row;

        for (const row of rows.filter(row => row.SGG_NM === sgg_nm && row.BJDONG_NM === bjdong_nm && (!cmp_nm || row.CMP_NM === cmp_nm))) {
          const getRatingOptions = {
            host: "stop_bang_review",
            port: process.env.PORT,
            path: `/review/avgRate/${(row.SYS_REGNO)}`,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          };
          
          try {
            const ratingResponse = await httpRequest(getRatingOptions);
            row.avg_rating = ratingResponse.body.avg;  // Adjust this depending on the actual API response
            row.countReview = ratingResponse.body.count;  // Adjust this as well
          } catch (error) {
            console.error(`Error fetching rating data for RA_REGNO ${row.SYS_REGNO}: ${error}`);
            row.avg_rating = 0;
            row.countReview = 0;
          }
          allFiltered.push(row);
        }

        if (rows.length < count) {
          hasMoreData = false;
        } else {
          start += count;
        }
      } else {
        console.log(`End of data or different structure: ${JSON.stringify(js)}`);
        hasMoreData = false;
      }
    } catch (error) {
      console.error(`Error fetching data: ${error}`);
      hasMoreData = false;
    }
  }
  return allFiltered;
}
exports.getAgency = async(req, res) => {
  const { sgg_nm, bjdong_nm } = req.body;
  try {
    const filteredData = await fetchAllData(sgg_nm, bjdong_nm);
    if (filteredData.length > 0) {
      return res.json(filteredData);
    } else {
      res.status(404).json({ message: "No matching data found." });
    }
  } catch (err) {
    console.error(`Error while processing request: ${err.stack}`);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
exports.getOneAgency = async(req, res) => {
  const { sgg_nm, bjdong_nm, cmp_nm } = req.body;
  console.log(sgg_nm, bjdong_nm, cmp_nm);
  try {
    const filteredData = await fetchAllData(sgg_nm, bjdong_nm, cmp_nm);
    if (filteredData.length > 0) {
      return res.json(filteredData); // Return only the first matched agency
    } else {
      res.status(404).json({ message: "No matching agency found." });
    }
  } catch (err) {
    console.error(`Error while processing request: ${err.stack}`);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};