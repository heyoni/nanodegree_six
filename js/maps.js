var map;
function initMap() {
    defaultPos = {lat: 40.695003, lng: -73.965920};
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultPos,
        zoom: 15
    });
    var marker = new google.maps.Marker({
        position: defaultPos,
        map: map
    });

    var request = {
        location: defaultPos,
        radius: 500,
        types: ['store']
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
}


function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(function (result) {
            var place = result;
            var lat = place.geometry.location.lat()
            var lng = place.geometry.location.lng()
            newLoc = {
                position: {
                    lat: lat,
                    lng: lng
                },
                map: map
            }
            new google.maps.Marker(newLoc, map);
        })
    }
}