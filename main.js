const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const bodyParser = require("body-parser"); //post에서 body 받기
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

//View
const layouts = require("express-ejs-layouts");

app.set("view engine", "ejs");
app.use(layouts);

app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const gu_options =["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"]
const searchController = require("./controllers/searchController");

// Route for the homepage
app.get("/search", (req, res) => {
    res.render('search', { gu_options: gu_options });
});

// Additional routes
app.get("/search/agencies", searchController.getAgency);
app.get("/search/agencyName", searchController.getOneAgency);


app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에게 대기중");
});