let map = L.map('map').setView([-27.495432, 153.012024], 12);

// Use the ArcGIS's map.
L.esri.Vector.vectorBasemapLayer('ArcGIS:Topographic', {
    apikey: "AAPKb74ce1d9657b4e7a937e5d491f507f80I6a303ICiJJ0cg5QgZhry93CHhjFPZOFp6LzeYpZ9JGcBgN1mdLirFVut47IjMZ-"
}).addTo(map);

// Using the basic map to replace the api map.
// L.esri.basemapLayer('Topographic').addTo(map);

const routes = L.esri.featureLayer({
    url: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/ArcGIS/rest/services/Bicycle_network_overlay/FeatureServer/0',
    // where: "DESCRIPTION = 'Primary cycle route'"
});

console.log(routes);

// Set the style (colour) of different route type.
let primaryStyle = {
    "color": "#EB92BE"
};

let secondaryStyle = {
    "color": "#7c83fd"
}

// Add a bounds aroud uq.
let southWest = L.latLng(-27.5014174, 152.9891076);
let northEast = L.latLng(-27.4776612, 153.0417289);
let bounds = L.latLngBounds(southWest, northEast);
// map.fitBounds(bounds);

// Query for primary clcle routes
// routes.query()
//     // .within(bounds)
//     .where("DESCRIPTION = 'Primary cycle route'")
//     .run(function (error, primaryRoutes) {
//         // console.log(primaryRoutes);

//         L.geoJSON(primaryRoutes, {
//             style: primaryStyle
//         }).addTo(map);
//     });

// // Query for local cycle routes.
// routes.query()
//     // .within(bounds)
//     .where("DESCRIPTION = 'Local cycle route'")
//     .run(function (error, secondaryRoutes) {
//         // console.log(secondaryRoutes);

//         L.geoJSON(secondaryRoutes, {
//             style: secondaryStyle
//         }).addTo(map);
//     });


// Add routes to basic map.
// routes.addTo(map);
// routes.setWhere("DESCRIPTION = 'Secondary cycle route'");

// routes.query()
//     .run(function (error, routes) {
//         console.log(routes);
//         L.geoJSON(routes, {
//             style: primaryStyle
//         }).addTo(map);
//     });

let filterButton = document.getElementById("filterButton");

// Get the values from html's form.
// filterButton.addEventListener("click", function() {
//     let exerciseLevel = document.getElementById("filter").elements.namedItem("exerciseLevel").value;
//     let ridingTime = document.getElementById("filter").elements.namedItem("ridingTime").value;

//     if (exerciseLevel == "easy") {
//         console.log(exerciseLevel, ridingTime);
//         routes.setWhere('Shape__Length < 2000');
//     } else if (exerciseLevel == "balanced") {
//         console.log(exerciseLevel, ridingTime);
//         routes.setWhere('Shape__Length >= 2000 and Shape__Length < 5000');
//     } else if (exerciseLevel == "hard") {
//         console.log(exerciseLevel, ridingTime);
//         routes.setWhere('Shape__Length >=5000');
//     }
// });

// Step 1
let marker;
let circle;
let query;
let queryLayer = L.layerGroup();
const radius = 3000; // radius is 3km

// test for click route segments.
// circle = L.circle([-27.495432, 153.012024], radius).addTo(map);
// map.fitBounds(circle.getBounds());
// query = routes.query()
//     .within(circle.getBounds());
function choosePoint() {
    map.on('click', function (point) {
        if (marker || circle) {
            map.removeLayer(marker);
            map.removeLayer(circle);
        }
        console.log(point.latlng);
        marker = L.marker(point.latlng).addTo(map);
        circle = L.circle(point.latlng, radius).addTo(map);
        const bounds = circle.getBounds();
        // map.fitBounds(bounds, {padding: [30, 30]});
        map.fitBounds(bounds);

        query = routes.query()
            .within(bounds);
    });
}


function pickRoutes(routesCollection) {
    let dict = routesCollection._layers;
    let key = Object.keys(dict)[Math.floor(Math.random() * Object.keys(dict).length)];
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
        sessionStorage.setItem('coordsArray', routeCoords);
    }
}

// Step 2 & 3
function routesFilter(level) {
    let queryCondition;
    if (level == 'easy') {
        queryCondition = 'Shape__Length < 2000';
    } else if (level == 'balanced') {
        queryCondition = 'Shape__Length >= 2000 and Shape__Length < 5000';
    } else if (level == 'hard') {
        queryCondition = 'Shape__Length >= 5000';
    }
    map.off('click');
    if (query) {
        map.removeLayer(query);
        query.where(queryCondition)
            .run(function (error, interestPoint) {
                if (error) {
                    return;
                }
                queryLayer.clearLayers();
                let routesLayer = L.geoJSON(interestPoint, {
                    style: secondaryStyle
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

// For checkbox rules.
// only allow to choose one option each line.
$('input[type="checkbox"]').on('change', function () {
    $(this).siblings('input[type="checkbox"]').prop('checked', false);
    $(this).prop('checked', true); // if the checkbox is already checked, keep it.
})

// Step 4
function showSlides() {
    $('#slideshow').css('visibility', 'visible');
}