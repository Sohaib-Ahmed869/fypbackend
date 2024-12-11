const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

const getWeatherByCity = async (req, res) => {
  const { city } = req.params;

  try {
    // Fetch 5-day weather forecast
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );

    const { list, city: cityInfo } = response.data;

    const dailyForecast = {};

    list.forEach((entry) => {
      const date = entry.dt_txt.split(" ")[0];
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date,
          temperature: {
            min: entry.main.temp_min,
            max: entry.main.temp_max,
          },
          weather: entry.weather[0].description,
        };
      } else {
        dailyForecast[date].temperature.min = Math.min(
          dailyForecast[date].temperature.min,
          entry.main.temp_min
        );
        dailyForecast[date].temperature.max = Math.max(
          dailyForecast[date].temperature.max,
          entry.main.temp_max
        );
      }
    });

    res.status(200).json({
      success: true,
      data: {
        city: cityInfo.name,
        country: cityInfo.country,
        dailyForecast: Object.values(dailyForecast),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch weather data",
      error: error.response ? error.response.data : error.message,
    });
  }
};

module.exports = { getWeatherByCity };
