var map;

function initMap() {
    defaultPos = {lat: 40.695003, lng: -73.965920};
    if (typeof google !== 'undefined') {
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultPos,
            zoom: 15
        });
        viewModel = new YelpViewModel();
        ko.applyBindings(viewModel);
        $('.results').css('display', 'block');
        $('.results-hide').css('display', 'block');
    } else {
        errorMap();
    }
}
var reloadMap = function () {
  $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyA9vxlBwdwNj1QKzf3jv9Abg2gDues9Vvw&callback=initMap&libraries=geometry");
};
var errorMap = function () {
    $('div#map').html('error loading map...click <a href="#" onclick="reloadMap()">here</a> to reload');
};
