let map = L.map("map").setView([-27.495432, 153.012024], 14);

// Use the ArcGIS's map.
L.esri.Vector.vectorBasemapLayer("ArcGIS:Topographic", {
  apikey:
    "AAPKb74ce1d9657b4e7a937e5d491f507f80I6a303ICiJJ0cg5QgZhry93CHhjFPZOFp6LzeYpZ9JGcBgN1mdLirFVut47IjMZ-",
}).addTo(map);

const routes = L.esri.featureLayer({
  url: "https://services2.arcgis.com/dEKgZETqwmDAh1rP/ArcGIS/rest/services/Bicycle_network_overlay/FeatureServer/0",
});

const river = L.esri.featureLayer({
    url: "https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Waterway_corridors_overlay_Brisbane_River_corridor_section_boundary/FeatureServer/0",
});

let routesBounds;
routes.query().run(function (error, interestPoint) {
  if (error) {
    return;
  }
  routesBounds = L.geoJSON(interestPoint).getBounds();
  L.rectangle(routesBounds, { color: "#50CB93", weight: 1 }).addTo(map);
});

// Set the style (colour) of different route type.
let primaryStyle = {
  color: "#50CB93",
  weight: 5,
};

let secondaryStyle = {
  color: "#7c83fd",
};

let riverRoutes = L.layerGroup();
let riverRoutesId = [];
function addRiverRoutes(feature) {
    routes.query().within(L.geoJSON(feature)).run(function (error, riverView) {
        if (error) {
            return;
        }
        riverView.features.forEach(function(feature) {
            riverRoutesId.push(feature['id']);
        })
        L.geoJSON(riverView, {
            style: secondaryStyle,
        }).addTo(riverRoutes);
    }); 
}

river.query().run(function (error, riverBounds) {
    if (error) {
        return;
    }
    console.log(riverBounds);
    console.log(riverBounds.features);
    riverBounds.features.forEach(addRiverRoutes);
    // riverRoutes.addTo(map);
});

let filterButton = document.getElementById("filterButton");

// Step 1
let routesLevel;
let marker;
let circle;
let query;
let queryLayer = L.layerGroup();
const radius = 3000; // radius is 3km

function choosePoint() {
  map.on("click", function (point) {
    if (!routesBounds.contains(point.latlng)) {
      alert("Please choose the point in the bounds");
    } else {
      if (marker || circle) {
        map.removeLayer(marker);
        map.removeLayer(circle);
      }
      console.log(point.latlng);
      marker = L.marker(point.latlng, { interactive: false }).addTo(map);
      circle = L.circle(point.latlng, radius, {
        color: "grey",
        opacity: 0.3,
        interactive: false,
      }).addTo(map);
      const bounds = circle.getBounds();
      map.fitBounds(bounds);
      query = routes.query().within(bounds);
      map.off("click");

      if (routesLevel) {
        routesFilter(routesLevel);
      }
    }
  });
}

function pickRoutes(routesCollection) {
  let dict = routesCollection._layers;
  let key =
    Object.keys(dict)[Math.floor(Math.random() * Object.keys(dict).length)];
  return dict[key];
}

function displayRoute(route, place) {
  let id = route.feature.properties["OBJECTID"];
  let length = route.feature.properties["Shape__Length"];
  length = Math.round(length) / 1000;
  let description = route.feature.properties["DESCRIPTION"];
  console.log(id, length, description);

  if ($(`.slides:nth-child(${place}) p`).length) {
    $(`.slides:nth-child(${place}) p`).remove();
    $(`.slides:nth-child(${place}) article`).append(`<p>${length} Km</p>`);
  } else {
    $(`.slides:nth-child(${place}) article`).append(`<p>${length} Km</p>`);
  }
}

let route1;
let route2;
let route3;
function recommend(routesCollection) {
  route1 = pickRoutes(routesCollection);
  route2 = pickRoutes(routesCollection);
  route3 = pickRoutes(routesCollection);
  displayRoute(route1, 1);
  displayRoute(route2, 2);
  displayRoute(route3, 3);
}

function sotreCoords(routeName) {
  if (routeName) {
    let routeCoords = routeName.feature.geometry.coordinates;
    console.log(routeCoords);
    sessionStorage.setItem("coordsArray", routeCoords);
  }
}

// Step 2 & 3
function routesFilter(level, idName) {
    console.log($(`#${idName}`).is(':checked'));
    if ($(`#${idName}`).is(':checked')) {
        routesLevel = level;
        let queryCondition;
        if (level == 'easy') {
            queryCondition = 'Shape__Length < 2000';
        } else if (level == 'balanced') {
            queryCondition = 'Shape__Length >= 2000 and Shape__Length < 5000';
        } else if (level == 'hard') {
            queryCondition = 'Shape__Length >= 5000';
        }
        if (query) {
            map.removeLayer(query);
            query.where(queryCondition)
                .run(function (error, interestPoint) {
                    if (error) {
                        return;
                    }
                    queryLayer.clearLayers();
                    let routesLayer = L.geoJSON(interestPoint, {
                        // style: secondaryStyle
                        style: primaryStyle
                    });
                    routesLayer.addTo(queryLayer);
                    queryLayer.addTo(map);
                    recommend(routesLayer);
                    routesLayer.on('click', function (event) {
                        console.log(event.layer.feature.properties);
                    });
                });
            }
    }
}

// For checkbox rules.
// only allow to choose one option each line.
$('input[type="checkbox"]').on("change", function () {
  $(this).siblings('input[type="checkbox"]').prop("checked", false);
  $(this).prop("checked", true); // if the checkbox is already checked, keep it.
});

// Step 4
function showSlides() {
  $("#slideshow").css("visibility", "visible");
}
