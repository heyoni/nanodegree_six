var radius;

var YelpViewModel = function () {
    var self = this;

    self.results = ko.observableArray([]);
    self.filter = ko.observable();
    self.filteredResults = ko.observableArray([]);

    // this variable is used by .results-list
    self.compResults = ko.computed(function () {
        // clear current results
        self.filteredResults.removeAll();
        self.results().find(function (result) {
            // performs a regex on the name string with the value in the filter input box
            var re = new RegExp(self.filter() || '' + '.*?', 'i');
            var match = result.restaurant.name.match(re);
            if (match != null) {
                // repopulates the filteredResults with any item that matched our filter
                self.filteredResults.push(result);
                result.marker.setVisible(true);
            } else {
                result.marker.setVisible(false);
            }
        });
        return (self.filteredResults());
    });

    self.populateResults = function () {
        [self.message, self.parameterMap] = searchYelp();
        // clear out all the results, markers and infowindows
        self.removeEntry();
        // query Yelp with new geographical location if it applies
        // results will be added to self.results() if successful
        self.query(self.message, self.parameterMap);
    };
    // remove an individual or all restaurants from the results list
    self.removeEntry = function (business) {
        if (business == null) {
            self.results().forEach(function (restaurant) {
                delete restaurant.infowindow;
                restaurant.marker.setMap(null);
            });
            self.results.removeAll();
        } else {
            delete business.infowindow;
            business.marker.setMap(null);
            self.results.remove(business);
        }
    };
    // query function used by self.populateResults()
    self.query = function () {
        $.ajax({
            'url': self.message,
            'data': self.parameterMap,
            'dataType': 'jsonp',
            'cache': true,
            'success': function (data) {
                console.log('successfully fetched Yelp data');
                data.businesses.forEach(function (business) {
                    self.results.push(markerModel(business));
                })
            },
            'error': function (jqXHR, textStatus, errorThrown) {
                self.results.push(markerModel(textStatus));
                console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
            },
            'timeout': 8000
        })
    }
};
// Model for individual markers, containing map marker, restaurant info and infowindow
var markerModel = function (result) {
    // console.log(typeof(result) == 'object');
    // check if result is a restaurant object, else assume it's an error code
    if (typeof(result) == 'object') {
        this.restaurant = {restaurant: result};
        this.restaurant.infowindow = setInfoWindow(result);
        this.restaurant.marker = setMarker(result, this.restaurant.infowindow);
    } else {
        this.restaurant = {restaurant: {name: 'error: ' + result}};
        this.restaurant.marker = new google.maps.Marker({
            position: {lat: map.getCenter().lat(), lng: map.getCenter().lng()},
            map: map,
            animation: google.maps.Animation.DROP
        });
        return this.restaurant
    }
    return this.restaurant;
};
// creating the google.maps.infoWindow for markerModel
setInfoWindow = function (result) {
    var contentStr = result.name + '<br>' + result.phone + '<br>' + result.rating + '<br>' + result.review_count + '<br>' + '<a href="' + result.url + '">more info</a>';
    return new google.maps.InfoWindow({
        content: contentStr
    })
};
// creating the google.maps.Marker object for markerModel
setMarker = function (result, infowindow) {
    lat = result.location.coordinate.latitude;
    lng = result.location.coordinate.longitude;
    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lng},
        map: map,
        animation: google.maps.Animation.DROP
    });
    // add event listener to each marker added to map
    marker.addListener('click', function () {
        popupInfo(marker, infowindow);
    });
    return marker;
};
// activates the popup window when user clicks on a list item
popupInfoFromList = function (business) {
    popupInfo(business.marker, business.infowindow);
};
// Handler for clicking on map marker
popupInfo = function (marker, infowindow) {
    // set animations
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
        marker.setAnimation(null);
    }, 2000);
    // close any opened infowindow
    viewModel.results().forEach(function (restaurant) {
        if (restaurant.infowindow.close) {
            console.log(restaurant.infowindow.close);
            restaurant.infowindow.close();
        }
    });
    infowindow.open(map, marker);
};
// make sure we search all restaurants contained in our radius
calculateRadius = function () {
    southWest = map.getBounds().getSouthWest();
    northEast = map.getBounds().getNorthEast();
    radius = google.maps.geometry.spherical.computeDistanceBetween(southWest, northEast) / 2;
};
// Yelp has a radius max of 40000 meters, zoom in if we're trying to cover an area that's too large
fitToRadius = function (radiusLimit) {
    // zoom in until we're within our prescribed radius
    while (radius >= radiusLimit) {
        calculateRadius();
        map.setZoom(map.getZoom() + 1);
    }
};
// hide the results list
var sideBar = {
    toggleSidebar: function () {
        $('div.results').toggle('close');
    }
};
function cb() {
    console.log('success');

}
// search Yelp for all restaurants within the radius of the map
// code adapted from user mighty_marks (github)
// https://github.com/levbrie/mighty_marks/blob/master/yelp-search-sample.html
function searchYelp() {
    calculateRadius();
    fitToRadius(40000);
    this.latitude = map.getCenter().lat();
    this.longitude = map.getCenter().lng();

    var auth = {
        //
        // Update with your auth tokens.
        //
        consumerKey: "4FsxJvMCGNmATdc58K6v-g",
        consumerSecret: "uppb9ixG1rTzaVj63kSugCxcpMg",
        accessToken: "tXNGmc-C_jdqQvhEPXSh84iMbZb7bj0n",
        // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
        // You wouldn't actually want to expose your access token secret like this in a real application.
        accessTokenSecret: "MxMfBMI5VVwEcsLTAQw7blLU-Qw",
        serviceProvider: {
            signatureMethod: "HMAC-SHA1"
        }
    };

    var terms = 'food';

    var accessor = {
        consumerSecret: auth.consumerSecret,
        tokenSecret: auth.accessTokenSecret
    };

    var parameters = [];
    parameters.push(['term', terms]);
    parameters.push(['ll', this.latitude + "," + this.longitude]);
    parameters.push(['radius_filter', radius]);
    parameters.push(['callback', 'cb']);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

    var message = {
        'action': 'https://api.yelp.com/v2/search',
        'method': 'GET',
        'parameters': parameters
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    var parameterMap = OAuth.getParameterMap(message.parameters);
    return [message.action, parameterMap];
}