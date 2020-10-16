let map; // Google Maps
let autocomplete; // Google Places AutoComplete
let inverted = false; // Switch between white or dark theme according to time of day


// Main class for one weather display
class Weather {

  constructor(meteodiv) {
    this.meteodiv = meteodiv;

    this.meteodiv.style.display = "none";

    this.search_lat = null;
    this.search_lng = null;
    this.name = "";

    let current_hour = new Date().getHours();
    if(current_hour<8 || current_hour>19) {
      document.body.className = "cycle cycle_night";
    }

    initAutoComplete();
  }

  handleResult(place) {
    if(place.address_components.length >= 4) {
      // This is a city
      this.search_lat = place.geometry.location.lat().toFixed(3);
      this.search_lng = place.geometry.location.lng().toFixed(3);
      this.name = place.vicinity;
      this.ismap = false;

      this.refresh();
    }
  }

  refresh() {
    if (!this.search_lat || !this.search_lng) return;

    fetch("https://www.prevision-meteo.ch/services/json/lat=" + this.search_lat + "lng=" + this.search_lng).then(response => {
      response.json().then(data => {
        this.info = new WeatherInfo(data);
        this.info.data.city_info.name = this.name;

        weather.display();
      })
    });
  }

  display() {
    document.getElementById("data").innerHTML = JSON.stringify(this.data);

    this.changeInfo("city", this.info.getCityName());
    this.changeInfo("sunrise_text", this.info.getSunrise());
    this.changeInfo("sunset_text", this.info.getSunset());

    this.changeInfo("datetime", this.info.getDateTime());
    this.changeInfo("time", this.info.getHour());

    this.changeInfo("condition", this.info.getCondition());
    changeFavicon(this.info.getConditionIcon());

    document.getElementsByClassName("cond_img")[0].innerHTML = getCondition(this.info.getCondition());

    this.changeInfo("temp_main", this.info.getTemp());
    this.changeInfo("temp_min", this.info.getTempMin());
    this.changeInfo("temp_max", this.info.getTempMax());

    this.changeInfo("wind", this.info.getWindSpeed());
    this.changeInfo("wind_dir", getDirection(this.info.getWindDir()));

    if (this.info.hour > this.info.getSunrise().split(":")[0] && this.info.hour <= this.info.getSunset().split(":")[0]) {
      if (inverted) {
        document.body.className = "cycle cycle_night";
      } else {
        document.body.className = "cycle cycle_day";
      }
    } else {
      if (inverted) {
        document.body.className = "cycle cycle_day";
      } else {
        document.body.className = "cycle cycle_night";
      }
    }

    if (!this.ismap) {
      initMap(document.getElementsByClassName("map")[0], this.info.getLatitude(), this.info.getLongitude(), 10);
      this.ismap = true;
    }

    this.meteodiv.style.display = "block";
  }

  changeInfo(target, info) {
    document.getElementsByClassName(target)[0].innerHTML = info;
  }

  nextDay() {
    this.info.setDay(this.info.day + 1);
    this.display();
  }

  prevDay() {
    this.info.setDay(this.info.day - 1);
    this.display();
  }

  nextHour() {
    this.info.setHour(this.info.hour + 1);
    this.display();
  }

  prevHour() {
    this.info.setHour(this.info.hour - 1);
    this.display();
  }
}

// Enables to get specific info based on date and hour from the raw json response
class WeatherInfo {

  constructor(data) {
    this.data = data;

    // Sets the cursor at the current date and time
    this.setDay(0);
    this.setHour(parseInt(this.data.current_condition.hour.split(":")[0]));
  }

  // 0 = today and then up to 4 days beyond
  setDay(day) {
    if (day >= 0 && day <= 4) {
      this.day = day;
    }
  }

  setHour(hour) {
    if (hour >= 0 && hour <= 23) {
      this.hour = hour;
    }
  }

  // Gets the data of the current cursor's day
  getDayData() {
    return this.data["fcst_day_" + this.day];
  }

  // Gets the data of the current cursor's hour
  getHourData() {
    return this.getDayData().hourly_data[this.hour + "H00"];
  }

  getDate() {
    return this.getDayData().date;
  }

  // Human readable hour
  getHour() {
    return this.hour + ":00";
  }

  // Human readable date '3 octobre 2020'
  getDateTime() {
    var dateParts = this.getDate().split(".");
    return (new Date(dateParts[2], dateParts[1] - 1, dateParts[0]))
      .toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // The following methods returns information based on the current cursor's location

  getTempMin() {
    return this.getDayData().tmin;
  }

  getTempMax() {
    return this.getDayData().tmax;
  }

  getTemp() {
    return this.getHourData().TMP2m;
  }

  getCondition() {
    return this.getHourData().CONDITION;
  }

  getWindSpeed() {
    return this.getHourData().WNDSPD10m;
  }

  getWindDir() {
    return this.getHourData().WNDDIRCARD10;
  }

  getCityName() {
    return this.data.city_info.name;
  }

  getLatitude() {
    return this.data.city_info.latitude;
  }

  getLongitude() {
    return this.data.city_info.longitude;
  }

  // Warning : sunrise and sunset are only valid for the city on the current day
  getSunrise() {
    return this.data.city_info.sunrise;
  }

  getSunset() {
    return this.data.city_info.sunset;
  }

  getConditionIcon() {
    return this.getHourData().ICON;
  }
}

// Google services related functions

function initMap(element, lat_, lng_, zoom_) {
  map = new google.maps.Map(element, {
    center: { lat: parseFloat(lat_), lng: parseFloat(lng_) },
    zoom: zoom_,
    styles: map_style
  });
}

function initAutoComplete() {
  let searchbox = document.getElementsByClassName("searchbox")[0];

  let searchoptions = {
    types: ['(regions)'], // Search by city name, postal code
    componentRestrictions: { country: "FR" }
  };

  autocomplete = new google.maps.places.Autocomplete(searchbox, searchoptions);

  searchbox.addEventListener("keyup", function (event) {
    if (event.keyCode === 13 || event.keyCode === 9) {
      getPlaceFromAutoComplete();
    }
  });

  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    getPlaceFromAutoComplete();
  });
}

function getPlaceFromAutoComplete() {
  let place = autocomplete.getPlace();

  if(!place || !place.address_components) {
    return;
  }
  
  weather.handleResult(place);
}

// Helper functions

var getHour = function (hour) {
  return hour.split(":")[0];
}

var getDirection = function (dir) {
  switch (dir) {
    case "N":
      return "Nord";
    case "E":
      return "Est";
    case "O":
      return "Ouest";
    case "S":
      return "Sud";
    case "NE":
      return "Nord-Est";
    case "NO":
      return "Nord-Ouest";
    case "SE":
      return "Sud-Est";
    case "SO":
      return "Sud-Ouest";
  }
}

var getCondition = function (cond) {
  switch (cond) {
    case "Ensoleillé":
      return '<i class="fas fa-sun"></i>';
    case "Nuit claire":
    case "Nuit bien dégagée":
    case "Nuit claire et stratus":
      return '<i class="far fa-moon"></i>';
    case "Ciel voilé":
    case "Faibles passages nuageux":
    case "Eclaircies":
    case "Faiblement nuageux":
    case "Développement nuageux":
      return '<i class="far fa-cloud-sun"></i>';
    case "Nuit légèrement voilée":
    case "Nuit nuageuse":
    case "Nuit avec développement nuageux":
      return '<i class="fas fa-cloud-moon"></i>';
    case "Brouillard":
      return '<i class="fas fa-smog"></i>';
    case "Stratus":
    case "Stratus se dissipant":
    case "Fortement nuageux":
      return '<i class="fas fa-cloud"></i>';
    case "Nuit avec averses":
      return '<i class="fas fa-cloud-moon-rain"></i>';
    case "Averses de pluie modérée":
    case "Averses de pluie faible":
    case "Pluie faible":
    case "Pluie modérée":
    case "Averses de pluie forte":
    case "Couvert avec averses":
    case "Pluie forte":
      return '<i class="fas fa-cloud-showers-heavy"></i>';
    case "Faiblement orageux":
    case "Nuit faiblement orageuse":
    case "Orage modéré":
    case "Fortement orageux":
      return '<i class="fas fa-bolt"></i>';
    case "Averses de neige faible":
    case "Neige faible":
    case "Neige modérée":
    case "Neige forte":
    case "Nuit avec averses de neige faible":
    case "Pluie et neige mêlée faible":
    case "Pluie et neige mêlée modérée":
    case "Pluie et neige mêlée forte":
      return '<i class="fas fa-snowflake"></i>';
  }
}

const map_style = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

// just some fun from https://stackoverflow.com/a/2995536

/*!
 * Dynamically changing favicons with JavaScript
 * Works in all A-grade browsers except Safari and Internet Explorer
 * Demo: http://mathiasbynens.be/demo/dynamic-favicons
 */

// HTML5™, baby! http://mathiasbynens.be/notes/document-head
document.head = document.head || document.getElementsByTagName('head')[0];

function changeFavicon(src) {
 var link = document.createElement('link'),
     oldLink = document.getElementById('dynamic-favicon');
 link.id = 'dynamic-favicon';
 link.rel = 'shortcut icon';
 link.href = src;
 if (oldLink) {
  document.head.removeChild(oldLink);
 }
 document.head.appendChild(link);
}

/////////////

let weather = new Weather(document.getElementsByClassName("app")[0]);