const db = require("../config/db");
const searchModel = require("../models/searchModel");
const jwt = require("jsonwebtoken");
const {httpRequest} = require('../utils/httpRequest');
const fetch = require('node-fetch');
//컨트롤러 함수에서는 데이터베이스에서 부동산중개업소 정보를 조회하는 비즈니스 로직을 수행

async function fetchAllData(sgg_nm, bjdong_nm) {
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

      // Check if the response includes the 'landBizInfo' and 'row' properties
      if (js.landBizInfo && js.landBizInfo.row) {
        const rows = js.landBizInfo.row;

        const filtered = rows.filter(row => row.SGG_NM === sgg_nm && row.BJDONG_NM === bjdong_nm);
        const modifiedFiltered = filtered.map(row => ({
          ...row,  
          avg_rating: 0, 
          countReview: 0  
        }));
        allFiltered.push(...modifiedFiltered);
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
  const sgg_nm = req.query.sgg_nm;
  const bjdong_nm = req.query.bjdong_nm;
  const cmp_nm = '%'+req.query.cmp_nm+'%';

  try {
    // 서울시 공공데이터 api
    const apiResponse = await fetch(
      `http://openapi.seoul.go.kr:8088/${process.env.API_KEY}/json/landBizInfo/1/1000/`
    );
    const js = await apiResponse.json();

    // const rows = await searchModel.getAgenciesModel(sgg_nm, bjdong_nm);
    const rows = js.landBizInfo.row;
    const filtered = [];

    for(const row of rows) {
      if(row.CMP_NM.includes(req.body.cmp_nm)) {
        filtered.push(row);
        row.avg_rating = 0; // 여기 고치자 원채야
        row.countReview = 0; // 여기 고치자 원채야
      }
    }
    
    return res.json(filtered);
    // const rows = await searchModel.getOneAgencyModel(sgg_nm,bjdong_nm,cmp_nm);
    // res.json({ rows: rows });
  } catch (err) {
    console.error(err.stack)
  }
  if (!res.headersSent) {  // 헤더가 이미 전송되지 않았는지 확인
    res.status(500).json({ error: "Internal Server Error", details: err.stack });
  }
}


