var radius;
var gData;
var gYata
var listMarker;
var markerMarker;

var YelpViewModel = function () {
    var self = this;

    self.lat = ko.observable(map.getCenter().lat());
    self.lng = ko.observable(map.getCenter().lat());
    self.results = ko.observableArray([]);
    self.filter = ko.observable();
    self.filteredResults = ko.observableArray([]);

    self.compResults = ko.computed(function () {
        self.filteredResults.removeAll();
        // iterates through our results array
        self.results().find(function(result) {
            // performs a regex on the name string with the value in the filter input box
            var re = new RegExp(self.filter() || '' + '.*?', 'i');
            var match = result[0].name.match(re);
            if ( match != null) {
                // repopulates the filteredResults with any item that matched our filter
                self.filteredResults.push(result);
            }
        });
        return(self.filteredResults());
    });

    self.populateResults = function (data) {
        [self.message, self.parameterMap] = searchYelp();
        // clear out all the results
        self.results.removeAll();
        // query Yelp with new geographical location if it applies
        // results will be added to self.results() if successful
        self.query(self.message, self.parameterMap);
    };

    self.remove = function (business) {
        business[1].setMap(null);
        self.results.remove(business);

        console.log(business[0].name);
    };

    self.query = function () {
        $.ajax({
            'url': self.message,
            'data': self.parameterMap,
            'dataType': 'jsonp',
            'cache': true,
            'success': function (data) {
                console.log('successfully fetched Yelp data');
                data.businesses.forEach(function (business) {
                    self.results.push([business, setMarker(business), setInfoWindow(business)]);
                    modal = markerModel(business);
                })
            },
            'timeout': 8000,
            'statusCode': {
                400: function () {
                    console.log('error 400. query error.');
                }
            }
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                    self.results.push([{name: 'Error loading results (' + textStatus + ')'}, 0]);
                    console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
                }
            );
    }
};
//implement this model for map markers and decouple this logic from viewModel
var markerModel = function (result) {
    this.restaurant = {restaurant: result};
    this.restaurant.infowindow = setInfoWindow(result);
    this.restaurant.marker = setMarker(result, this.restaurant.infowindow);
    console.log(this.restaurant);
    return this.restaurant;
};
setInfoWindow = function (result) {
    var contentStr = result.name + '<br>' + result.phone + '<br>' + 'result.rating' + '<br>' + result.review_count;
    console.log(contentStr);
    return new google.maps.InfoWindow({
        content: contentStr
    })
};
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

popupInfo = function (marker, infowindow) {
    // set animations
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
        marker.setAnimation(null);
    }, 2000);
    infowindow.open(map, marker);
    //
    // console.log(marker);
    // markerMarker = marker;
    // viewModel.results().find(function (subarray) {
    //     if (subarray.indexOf(markerMarker) == 1) {
    //         console.log(subarray[0].name);
    //     }
    // })
    console.log('marker clicked...');
};
calculateRadius = function () {
    var bounds = map.getBounds();
    // "{"south":-89.44859772059726,"west":-180,"north":89.86264605920618,"east":180}"
    southWest = map.getBounds().getSouthWest()//.toJSON();
    northEast = map.getBounds().getNorthEast()//.toJSON();
    radius = google.maps.geometry.spherical.computeDistanceBetween(southWest, northEast) / 2;
};
fitToRadius = function (radiusLimit) {
    // lat/lng per 1 meter
    while (radius >= radiusLimit) {
        calculateRadius();
        // latMeter = Math.abs((northEast.lat() - map.getCenter().lat()) / radius);
        // lngMeter = Math.abs((northEast.lng() - map.getCenter().lng()) / radius);
        // northBoundary = map.getCenter().lat() + (latMeter * 39000);
        // southBoundary = map.getCenter().lat() - (latMeter * 39000);
        // westBoundary = map.getCenter().lng() - (lngMeter * 39000);
        // eastBoundary = map.getCenter().lng() + (lngMeter * 39000);
        // // this function only makes sure to contain the boundaries and may be larger than what we need
        // map.fitBounds({south: southBoundary, west: westBoundary, north: northBoundary, east: eastBoundary});
        map.setZoom(map.getZoom() + 1);
    }
}
clearMarkers = function () {

};

function cb() {
    // console.log("cb: " + JSON.stringify(data));
    console.log('success');

}

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
var viewModel = new YelpViewModel();
ko.applyBindings(viewModel);

function getMethods(obj)
{
    var res = [];
    for(var m in obj) {
        if(typeof obj[m] == "function") {
            res.push(m)
        }
    }
    return res;
}
