var map;

function initMap() {
    defaultPos = {lat: 40.695003, lng: -73.965920};
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultPos,
        zoom: 15,
    });
    map.addListener('bounds_changed', function () {

    })
}
