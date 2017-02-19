var radius;

var YelpViewModel = function () {
    var self = this;

    self.lat = ko.observable(map.getCenter().lat());
    self.lng = ko.observable(map.getCenter().lat());

    // queryYelp(self.lat(), self.lng());
    // fetchToken();
    calculateRadius();
    searchYelp(self.lat(), self.lng());
}

setMarkers = function (yelpResults) {
    ydata = yelpResults;
    yelpResults.forEach(function (result) {
        lat = result.location.coordinate.latitude;
        lng = result.location.coordinate.longitude;
        var marker = new google.maps.Marker({
            position: {lat: lat, lng: lng},
            map: map
        });
        console.log(result)
    })
}
calculateRadius = function () {
    var bounds = map.getBounds();
    var boundsLeft = new google.maps.LatLng(bounds.f.f, bounds.b.f);
    var boundsRight = new google.maps.LatLng(bounds.f.b, bounds.b.b);
    radius = google.maps.geometry.spherical.computeDistanceBetween(boundsRight, boundsLeft) / 2;
}

clearMarkers = function () {

}

function cb(data) {
    console.log("cb: " + JSON.stringify(data));
}

function searchYelp(latitude, longitude) {
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
    var near = 'Brooklyn';

    var accessor = {
        consumerSecret: auth.consumerSecret,
        tokenSecret: auth.accessTokenSecret
    };

    var parameters = [];
    parameters.push(['term', terms]);
    parameters.push(['location', near]);
    parameters.push(['cll', latitude + "," + longitude]);
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

    $.ajax({
        'url': message.action,
        'data': parameterMap,
        'dataType': 'jsonp',
        'cache': true,
        'success': function (data) {
            setMarkers(data.businesses);
            console.log('success');
        }
    })
        .fail(function (jqXHR, textStatus, errorThrown) {
                console.log('error[' + errorThrown + '], status[' + textStatus + '], jqXHR[' + JSON.stringify(jqXHR) + ']');
            }
        );
}

ko.applyBindings(new YelpViewModel());
