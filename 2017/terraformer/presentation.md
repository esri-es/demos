<!-- .slide: class="title" -->

## Terraformer API
Raul Jimenez ([@hhkaos](https://twitter.com/hhkaos))

[esri-es.github.io/demos/2017/terraformer](https://esri-es.github.io/demos/2017/terraformer)

---

### WKT, GeoJSON & ArcGIS:

```
// WKT (Well Known Text)
// POINT (-105.01621 39.57422)

// GeoJSON
{
  "type": "Point",
  "coordinates": [
    -105.01621,
    39.57422
  ]
}

// ArcGIS
{
  "x": -105.01621,
  "y": 39.57422,
  "spatialReference": {
    "wkid": 4326
  }
}
```



---

### [Terraformer.io](http://terraformer.io/)

* Terraformer modules:

  * [Terraformer Core](http://terraformer.io/core/)
  * [WKT Parser](http://terraformer.io/wkt-parser/)
  * [ArcGIS Geometry Parser](http://terraformer.io/arcgis-parser/)
  * [GeoStore](http://terraformer.io/geostore/)

> [github.com/Esri?q=terraformer](https://github.com/Esri?utf8=%E2%9C%93&q=terraformer)

---

### Terraformer browser

<iframe src="demos/terraformer-browser/" style="width:100%; height:550px"></iframe>

Convert between:
[WKT](demos/data/waldocanyon.wkt),
[GEOJSON](demos/data/waldocanyon-geojson.json) and
[ARCGIS](demos/data/waldocanyon-arcgis.json) ([view code](https://github.com/esri-es/terraformer-demo/blob/master/browser/viewer.js))

---

### Terraformer NodeJS

WKT -> GeoJSON / ArcGIS
```
$ node convert.js --in-format wkt --out-format arcgis waldocanyon.wkt > waldocanyon-arcgisn.json
$ node convert.js --in-format wkt --out-format geojson waldocanyon.wkt > waldocanyon-geojson.json
```

GeoJSON -> WKT / ArcGIS
```
$ node convert.js --in-format geojson --out-format wkt point-geojson.json > point.wkt
$ node convert.js --in-format geojson --out-format arcgis point-geojson.json > point-arcgis.json
```

ArcGIS -> GeoJSON / ArcGIS
```
$ node convert.js --in-format arcgis --out-format geojson line-arcgis.json > line-geojson.json
$ node convert.js --in-format arcgis --out-format wkt line-arcgis.json > line.wkt
```

---

### [arcgis-to-geojson-utils](https://github.com/Esri/arcgis-to-geojson-utils)

```javascript
var arcgisToGeoJSON = require('arcgis-to-geojson-utils').arcgisToGeoJSON;
var geojsonToArcGIS = require('arcgis-to-geojson-utils').geojsonToArcGIS;

// parse ArcGIS JSON, convert it to GeoJSON
var geojson = arcgisToGeoJSON({
  "x":-122.6764,
  "y":45.5165,
  "spatialReference": {
    "wkid": 4326
  }
});

// take GeoJSON and convert it to ArcGIS JSON
var arcgis = geojsonToArcGIS({
  "type": "Point",
  "coordinates": [45.5165, -122.6764]
});
```

---

### GeoJSON Layer

<iframe src="http://esri.github.io/geojson-layer-js/geojsonlayer.html" style="width:100%; height:550px"></iframe>

Repo: [github.com/Esri/geojson-layer-js](https://github.com/Esri/geojson-layer-js)

---

### ArcGIS -> GeoJSON

* [Layer](http://services.arcgis.com/Q6ZFRRvMTlsTTFuP/ArcGIS/rest/services/Barrios%20de%20Madrid%20con%20poblaci%C3%B3n/FeatureServer/0):
   * Where: 1=1
   * Output Spatial Reference:	4326
   * Format: GEOJSON

Test: [geojson.io](http://geojson.io/) | [gist.github.com](https://gist.github.com/hhkaos/e7e90d027c4519c990f859c6efa2efe6)

---

### ArcGIS -> GeoJSON (Leaflet)

<iframe src="demos/leaflet-geojson.html" style="width:100%; height:550px"></iframe>

> Demo - [Edit code](demos/leaflet-geojson.html)

---

<!-- .slide: class="questions centered" -->

## Questions?

* Raul Jimenez:
  * [twitter.com/hhkaos](https://twitter.com/hhkaos)
  * [github.com/hhkaos](https://github.com/hhkaos)
  * [youtube.com/hhkaos](https://youtube.com/hhkaos)

Slides: [esri-es.github.io/demos/2017/terraformer](https://esri-es.github.io/demos/2017/terraformer)

---

<!-- .slide: class="end" -->
#
