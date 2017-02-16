var Model = [];

var View = function () {

}

var ViewModel = function () {
    var self = this;
    this.lat = ko.observable(map.getCenter().lat());
    this.lng = ko.observable();

    this.setLat = function() {
        self.lat(map.getCenter().lat());
    }

}

var NYTViewModel = function() {
    var nytKey = '5579364465da4d33bdb204c6b31c32cb';
}

ko.applyBindings(new ViewModel());