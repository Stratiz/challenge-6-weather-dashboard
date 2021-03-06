// Harrison 6/12/2022

// Define constants
const API_KEY = "f607e93849c9d442eb9c7eb5d42266c8" // Terrible practice

//Helper functions

function GetDateStringFromTime(time) {
  var date = new Date(time*1000);
  return (date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear()
}

// API functions

function makeQueryString(paramsObject) { // Makes query string from object
  var rawQueryString = "?"; 
  var currentInteration = 0;
  let objectLength = Object.keys(paramsObject).length
  for (var key in paramsObject) {
      currentInteration += 1;
      rawQueryString = rawQueryString + key + "=" + paramsObject[key];
      if (currentInteration < objectLength) {
          rawQueryString = rawQueryString + "&"
      }
  }
  return encodeURI(rawQueryString);
}

async function GetCityLocation(city) { // Gets Longitude and Latitude from a city
  var locationData = await fetch("https://api.openweathermap.org/geo/1.0/direct" + makeQueryString({q:city,appid:API_KEY})).then(response => response.json());
  if (locationData && locationData[0] && locationData[0].lat) {
    return {lon : locationData[0].lon, lat : locationData[0].lat}
  } else {
    return {}
  }
}

async function GetWeatherDataForCity(city) { // Gets weather information from a city name
  let locationData = await GetCityLocation(city)
  if (locationData.lat) {
    var weatherData = await fetch("https://api.openweathermap.org/data/2.5/onecall" + makeQueryString({
      lon : locationData.lon, 
      lat: locationData.lat, 
      units : "imperial",
      exclude : "minutely,hourly,alerts",
      appid : API_KEY
    })).then(response => response.json());
    if (weatherData.lat) {
      return await weatherData
    } else { 
      return await {message : "Failed to get weather data"}
    }
  }
  return await {message : "Failed to get location"}
}

// Data getter and setter function for history
function getHistory() { // Fetches the leaderboard data from localStorage
  let historyList = JSON.parse(localStorage.getItem("history"));
  if (!historyList) {
    historyList = [];
  }
  return historyList
}

function addToHistory(name) { //Adds a user to the leaderboard
  let historyList = getHistory();
  var found = false;
  for (city of historyList) {
    if (city.toLowerCase() == name.toLowerCase()) {
      found = true
      break;
    }
  }
  if (found == false) {
    historyList.push(name)
    localStorage.setItem("history", JSON.stringify(historyList));
    return true;
  }
  return false;
}

// HTML functions

let historyList = $("#previous-search")

function AddHistoryButton(cityName) { // Adds a button to the history list
  var newListItem = $("<li></li>");
  newListItem.append($('<button class="btn btn-secondary" style="width: 100%; margin-top: 10px;">'+ cityName +'</button>'));

  historyList.append(newListItem);
}

function MakeDayObject(data) { // Makes the JQuery object for a daily forcast entry

  var mainDiv = $('<div class="col daily-entry"></div>')
  var date = $('<h3>' + GetDateStringFromTime(data.dt) +'</h3>')
  var img = $('<img src="https://openweathermap.org/img/wn/' + data.weather[0].icon +'.png">')
  var temp = $('<p>Temp: ' + data.temp.day + '??F</p>')
  var wind = $('<p>Wind: ' + data.wind_speed + ' MPH</p>')
  var humidity = $('<p>Humidity: ' + data.humidity + '%</p>')

  mainDiv.append(date);
  mainDiv.append(img);
  mainDiv.append(temp);
  mainDiv.append(wind);
  mainDiv.append(humidity);

  return mainDiv
}

function PopulateDetailsForCity(city) { // Populates the main detail section with weather information
  var cityName = $("#city-name");
  var temp = $("#temp");
  var wind = $("#wind");
  var humidity = $("#humidity");
  var uv = $("#uv");

  var dailyList = $("#5-day")

  GetWeatherDataForCity(city).then(function(data) {
    if (data.current) {
      cityName.html('<h2 id="city-name" >' + city +" (" + GetDateStringFromTime(data.current.dt) + ")" + '<img id="weather-icon" src=https://openweathermap.org/img/wn/' + data.current.weather[0].icon + '.png></h2>')
      temp.text("Temp: " + data.current.temp + "??F");
      wind.text("Wind: " + data.current.wind_speed + " MPH");
      humidity.text("Humidity: " + data.current.humidity + "%");
      
      // Set UV colors
      var uvValue = data.current.uvi
      uv.text(uvValue);
      if (uvValue < 3) {
        uv.css("background-color","#83C88B");
      } else if (uvValue < 6) { 
        uv.css("background-color","#EAC002");
      } else if (uvValue < 8) { 
        uv.css("background-color","#F89C1C");
      } else if (uvValue < 11) { 
        uv.css("background-color","#EE1D23");
      } else { 
        uv.css("background-color","#D83484");
      }

      // Populate daily forcast

      dailyList.empty();
      for (i=1; i<=5; i++) {
        if (data.daily[i]) {
          var newObject = MakeDayObject(data.daily[i]);
          dailyList.append(newObject);
        }
      }
    } else {
      cityName.text("Invalid City (" + data.message + ")");
    }
  })
}

// Main init function.
$(async function() {
 
  // Get elements
  var previousSearchList = $('#previous-search');
  var searchButton = $('#search-btn');
  var searchInput = $('#search-box');

  // Populate data when search button is clicked
  searchButton.on('click',function() {
    var inputValue = searchInput.val();
    if (inputValue && inputValue.length > 0) {
      PopulateDetailsForCity(inputValue)
      if (addToHistory(inputValue) == true) {
        AddHistoryButton(inputValue);
      }
    }
  })

  // Get data from previous searches
  previousSearchList.on("click", "button", function(element) {
    PopulateDetailsForCity(element.currentTarget.innerText);
  })


  // Populate previous searches.
  for (city of getHistory()) {
    AddHistoryButton(city);
  }
})