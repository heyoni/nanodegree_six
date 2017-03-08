var map;

function initMap() {
    defaultPos = {lat: 40.695003, lng: -73.965920};
    if (typeof google !== 'undefined') {
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultPos,
            zoom: 15,
        });
        map.addListener('bounds_changed', function () {
        })
    } else {
        errorMap();
    }
};

var errorMap = function () {
    $('div#map').html('error loading map...');
};
