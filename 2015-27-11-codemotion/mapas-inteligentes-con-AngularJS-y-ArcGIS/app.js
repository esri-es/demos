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
        'esri/dijit/Search',
        'esri/toolbars/draw',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/layers/GraphicsLayer',
        'esri/graphic',
        'esri/Color',
        'esri/dijit/analysis/CreateDriveTimeAreas'
      ],function(Search, Draw, SimpleMarkerSymbol, GraphicsLayer, Graphic, Color, CreateDriveTimeAreas){

        var s = new Search({
          map: map
        }, "search");
        s.startup();

        var placesLayer = new GraphicsLayer();
        map.addLayer(placesLayer);

        var tb;
        var markerSymbol = new SimpleMarkerSymbol();
        // icon from http://raphaeljs.com/icons/#flag-alt
        markerSymbol.setPath('M19.562,10.75C21.74,8.572,25.5,7,25.5,7c-8,0-8-4-16-4v10c8,0,8,4,16,4C25.5,17,21.75,14,19.562,10.75zM6.5,29h2V3h-2V29z');
        markerSymbol.setColor(new Color('#FBCF80'));


        // get a local reference to the map object once it's loaded
        // and initialize the drawing toolbar
        function initToolbar(mapObj) {
          map = mapObj;
          tb = new Draw(map);
          tb.on('draw-end', function(e) {
            $scope.$apply(function() {
              addGraphic(e);
            });
          });

          // set the active tool once a button is clicked
          // apply this function binding to scope since it is outside of the digest cycle
          $scope.$apply(function() {
            $scope.activateDrawTool = activateDrawTool;
          });
        }

        function activateDrawTool(tool) {
          map.disableMapNavigation();
          tb.activate(tool.toLowerCase());
        }

        function addGraphic(evt) {
          //deactivate the toolbar and clear existing graphics
          tb.deactivate();
          map.enableMapNavigation();
          placesLayer.add(new Graphic(evt.geometry, markerSymbol));
        }

        // bind the toolbar to the map
        initToolbar(map);



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