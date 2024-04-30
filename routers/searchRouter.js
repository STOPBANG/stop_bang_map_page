const express = require("express");
const router = express.Router();
const searchController = require("./controllers/searchController");
const gu_options =["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"]
// Route for the homepage
router.use((req, res, next) => {
    console.log("Router for search was started");
    next();
  });
router.get("/search", (req, res) => {
    res.render('search', { gu_options: gu_options });
});

// Additional routes
app.get("/search/agencies", searchController.getAgency);
app.get("/search/agencyName", searchController.getOneAgency);
module.exports = router;