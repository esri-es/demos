'use strict';

var map;

require([
  'esri/map',
  'esri/Color',
  'esri/graphic',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/geometry/Geometry',
  'dojo/query'
], function (Map, Color, Graphic, SimpleLineSymbol, SimpleFillSymbol, Geometry, query) {

  map = new Map('map', {
    basemap: 'topo',
    center: [-122, 45],
    zoom: 6
  });

  var hullOutline = new SimpleLineSymbol('dash',new Color([47,140,212]), 2);
  var boundsOutline = new SimpleLineSymbol('dash',new Color([212,125,47]), 2);
  var hullSymbol = new SimpleFillSymbol('solid', hullOutline, new Color([195,229,255,0.5]));
  var boundsSymbol = new SimpleFillSymbol('solid', boundsOutline, new Color([255,215,180,0.5]));

  var currentPrimitive;
  var shape;


  var addGraphic = function (arcgis){
    // if arcgis.geometry is set we have a graphic json
    // else we can create our own json and set the symbol on it.
    if(arcgis.geometry){
      shape = new Graphic(arcgis).setSymbol(new SimpleFillSymbol());
    } else {
      shape = new Graphic({
        geometry: arcgis
      }).setSymbol(new SimpleFillSymbol());
    }

    // add the graphic to the map
    map.graphics.add(shape);

    // center the map on the graphic
    map.setExtent(shape.geometry.getExtent());
  };

  var showArcGIS = function(arcgis){
    currentPrimitive = Terraformer.ArcGIS.parse(arcgis);
    addGraphic(arcgis);
  };

  var showWKT = function(wkt){
    currentPrimitive = Terraformer.WKT.parse(wkt);
    var arcgis = Terraformer.ArcGIS.convert(currentPrimitive);
    addGraphic(arcgis);
  };

  var showGeoJSON = function(geojson){
    // convert the geojson object to a arcgis json representation
    currentPrimitive = new Terraformer.Primitive(geojson);
    var arcgis = Terraformer.ArcGIS.convert(currentPrimitive);
    addGraphic(arcgis);
  };

  function showOnMap(){
    map.graphics.clear();

    // parse the input as json
    var input = query('.tab-pane.active textarea').attr('value')[0];
    var type = query('.tab-pane.active textarea').attr('data-type')[0];


    switch(type){
    case 'wkt':
      try{
        showWKT(input);
      }catch(e){ alert("This is not a WKT valid format");}
      break;
    case 'geojson':
      try{
        showGeoJSON(JSON.parse(input));
      }catch(e){ alert("This is not a GeoJSON valid format");}
      break;
    case 'arcgis':
      try{
        showArcGIS(JSON.parse(input));
      }catch(e){ alert("This is not an ArcGIS valid format");}
      break;
    }
  }

  function showConvexOnMap(){

    // create a convex hull
    var convex = new Terraformer.Polygon([ currentPrimitive.convexHull() ]);

    // convert the geojson object to a arcgis json representation
    var arcgis = Terraformer.ArcGIS.convert(convex.coordinates[0]);

    // create a new geometry object from json
    var geometry = Geometry.fromJson(arcgis);

    // make a new graphic to put on the map
    var gfx = new Graphic(geometry, hullSymbol);

    // add the graphic to the map
    map.graphics.add(gfx);

    shape.getDojoShape().moveToFront();

    // center the map on the graphic
    map.setExtent(gfx.geometry.getExtent());
  }

  function showBBoxOnMap(){

    var box = currentPrimitive.bbox();

    // create a bbox hull
    var bbox = new Terraformer.Polygon( [ [ [ box[0], box[1] ], [ box[0], box[3] ], [ box[2], box[3] ], [ box[2], box[1] ], [ box[0], box[1] ]  ] ] );

    // convert the geojson object to a arcgis json representation
    var arcgis = Terraformer.ArcGIS.convert(bbox);

    // create a new geometry object from json
    var geometry = Geometry.fromJson(arcgis);

    // make a new graphic to put on the map
    var gfx = new Graphic(geometry, boundsSymbol);

    // add the graphic to the map
    map.graphics.add(gfx);

    shape.getDojoShape().moveToFront();

    // center the map on the graphic
    map.setExtent(gfx.geometry.getExtent());
  }

  query('#submit').on('click', showOnMap);
  query('#bounding').on('click', showBBoxOnMap);
  query('#convex').on('click', showConvexOnMap);
  query('#clear').on('click', function(){
    map.graphics.clear();
  });
});
