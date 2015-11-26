angular.module('esri-map-example', ['esri.map'])
  .controller('MapController', function ($scope, esriLoader) {
    $scope.map = {
      center: {
        lng: -3.703403,
        lat: 40.4171792
      },
      zoom: 15,
      basemap: 'gray'
    };

    $scope.layers = [{
      name: 'Líneas de metro',
      url: 'http://services1.arcgis.com/8MFSmLQvO5AV2Ytj/arcgis/rest/services/LineasMetro/FeatureServer/0'
    },{
      name: 'Estaciones de metro',
      url: 'http://services1.arcgis.com/8MFSmLQvO5AV2Ytj/arcgis/rest/services/Estaciones_de_Metro_Madrid/FeatureServer/0'
    }
    ];

    $scope.onMapLoad = function(map) {

      esriLoader.require([
        "esri/dijit/Search"
      ],function(Search){

        var s = new Search({
          map: map
        }, "search");
        s.startup();

      });
    };

    // list of layers currently added to the map
    $scope.selectedLayers = [];

    // add/remove a layer to/from the map by URL
    $scope.toggleLayer = function (url) {
      console.log('Toggling ' + url);
      var index = $scope.selectedLayers.indexOf(url);
      if (index >= 0) {
        $scope.selectedLayers.splice(index, 1);
      } else {
        $scope.selectedLayers.push(url);
      }
      console.log('Selected layers: ' + $scope.selectedLayers);
    };
  });