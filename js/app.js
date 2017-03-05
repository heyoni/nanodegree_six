var radius;

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
        self.results().find(function (result) {
            // performs a regex on the name string with the value in the filter input box
            var re = new RegExp(self.filter() || '' + '.*?', 'i');
            var match = result.restaurant.name.match(re);
            if (match != null) {
                // repopulates the filteredResults with any item that matched our filter
                self.filteredResults.push(result);
            }
        });
        return (self.filteredResults());
    });

    self.populateResults = function () {
        [self.message, self.parameterMap] = searchYelp();
        // clear out all the results
        // self.results.removeAll();
        self.removeEntry();
        // query Yelp with new geographical location if it applies
        // results will be added to self.results() if successful
        self.query(self.message, self.parameterMap);
    };

    self.removeEntry = function (business) {
        if (business == null) {
            self.results().forEach(function (restaurant) {
                // if you remove an object while iterating through it, the item in the position ahead will move down,
                // but the loop will move up in the index, leaving behind half of the results unprocessed.
                // somehow destroy() works because it hides the results rather than delete them.
                self.results.destroy(restaurant);
                delete restaurant.infowindow
                restaurant.marker.setMap(null);
                // restaurant.marker.setMap(null);
            })
        } else {
            console.log('business is not null');
            self.results.destroy(business);
            delete business.infowindow;
            business.marker.setMap(null);
        }
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
                    // console.log(markerModel(business));
                    self.results.push(markerModel(business));
                })
            },
            'error': function (jqXHR, textStatus, errorThrown) {
                self.results.push(markerModel(textStatus));
                // self.results.push([{name: 'Error loading results (' + textStatus + ')'}, 0]);
                console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
            },
            'timeout': 8000,
        })
    }
};
// implement this model for map markers and decouple this logic from viewModel
var markerModel = function (result) {
    // console.log(typeof(result) == 'object');
    // check if result is a restaurant object, else assume it's an error code
    if (typeof(result) == 'object') {
        this.restaurant = {restaurant: result};
        this.restaurant.infowindow = setInfoWindow(result);
        this.restaurant.marker = setMarker(result, this.restaurant.infowindow);
    } else {
        this.restaurant = {restaurant: {name: 'error: ' + result}};
        return this.restaurant
    }
    return this.restaurant;
};
setInfoWindow = function (result) {
    var contentStr = result.name + '<br>' + result.phone + '<br>' + 'result.rating' + '<br>' + result.review_count;
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
    // close any opened infowindow
    viewModel.results().forEach(function (restaurant) {
        restaurant.infowindow.close();
    })
    infowindow.open(map, marker);
};
calculateRadius = function () {
    var bounds = map.getBounds();
    // "{"south":-89.44859772059726,"west":-180,"north":89.86264605920618,"east":180}"
    southWest = map.getBounds().getSouthWest()//.toJSON();
    northEast = map.getBounds().getNorthEast()//.toJSON();
    radius = google.maps.geometry.spherical.computeDistanceBetween(southWest, northEast) / 2;
};
fitToRadius = function (radiusLimit) {
    // zoom in until we're within our prescribed radius
    while (radius >= radiusLimit) {
        calculateRadius();
        map.setZoom(map.getZoom() + 1);
    }
};

var sideBar = {
    hidden: 0,
    offset: 0,
    toggleSidebar : function () {
        if (this.hidden == 0) {
            $('div.results').css('right', -this.offset);
            $('a.results-hide').html('<i class="fa fa-chevron-left fa-lg" aria-hidden="true">');
            this.hidden = 1;
        } else {
            this.hidden = 0;
            $('div.results').css('right', 0);
            $('a.results-hide').html('<i class="fa fa-chevron-right fa-lg" aria-hidden="true">');
        }
    },
    setOffset: function () {
        console.log('running sidebardotoffset');
        this.offset = ($('div.results').outerWidth(true) - $('div.results div.results-list').outerWidth(true)) / 2 + $('div.results div.results-list').outerWidth(true);
    }
};
$(".results").on("DOMSubtreeModified", function () {
    sideBar.setOffset();
});
// $(".results").on("DOMSubtreeModified.sideBar", sideBar.setOffset);
function cb() {
    // console.log("cb: " + JSON.stringify(data));
    console.log('success');

};

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
};
var viewModel = new YelpViewModel();
ko.applyBindings(viewModel);

function getMethods(obj) {
    var res = [];
    for (var m in obj) {
        if (typeof obj[m] == "function") {
            res.push(m)
        }
    }
    return res;
};
