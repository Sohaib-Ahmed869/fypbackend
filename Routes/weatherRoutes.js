const express = require("express");
const { getWeatherByCity } = require("../Controllers/weatherController");

const router = express.Router();

// Route to get weather by city name
router.get("/:city", getWeatherByCity);

module.exports = router;
