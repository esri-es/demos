# Mapas inteligentes con AngularJS y ArcGIS
¿Cómo añadir la dimensión geográfica a una aplicación escrita con AngularJS? Es decir, ¿cómo podemos incrustar mapas interactivos en una aplicación y que se hable con el resto de la interfaz de usuario?

En este workshop práctica veremos cómo crear mapas interactivos con capacidad de análisis usando la [API JavaScript de ArcGIS](http://js.arcgis.com/) y las directivas del proyecto de **Github**: [angular-esri-map](https://github.com/esri/angular-esri-map)

# Pasos

## 0) Hola mundo

Primero clonamos el repositorio:

```bash
cd workspace && git clone git@github.com:esri-es/demos.git esri-demos
```

Luego entramos en el directorio e instalamos las dependencias:

```bash
cd esri-demos/2015-27-11-codemotion/mapas-inteligentes-con-AngularJS-y-ArcGIS && bower install angular-esri-map
```

Vamos al paso 1.

```bash
git checkout -f step-0
```

Y lanzamos un servidor de páginas, por ejemplo [http-server](https://www.npmjs.com/package/http-server):

```bash
http-server -p 9090
```

## 1) Basemaps

En este paso simplemente vamos a añadir un selector que nos permita cambiar de basemap.

[Ver cambios](https://github.com/esri-es/demos/commit/72381b8c099abd2674e26adbe5c88f98bc7c6ada?diff=unified)

```bash
git checkout -f step-1
```

## 2) Añadir y quitar capas de datos

Ahora vamos hacer que las capas de datos cambien dinámicamente, para ello usaremos una capa de [líneas de metro de madrid](http://services1.arcgis.com/8MFSmLQvO5AV2Ytj/arcgis/rest/services/LineasMetro/FeatureServer/0)
y otra de [estaciones de metro](http://services1.arcgis.com/8MFSmLQvO5AV2Ytj/arcgis/rest/services/Estaciones_de_Metro_Madrid/FeatureServer/0)
que [ha compartido un usuario públicamente](http://hhkaos2.maps.arcgis.com/home/search.html?q=owner:federico.lopez1) a través de [ArcGIS Online](http://www.arcgis.com/home/search.html?q=madrid&t=content)

[Ver cambios](https://github.com/esri-es/demos/commit/e927abd77816bac195cea0e3c673279d6737fd8f)

```bash
git checkout -f step-2
```

## 3) Añadimos un widget

Como las directivas sólo incluyen una mínima parte de las funcionalidades de la [API JavaScript de ArcGIS](http://js.arcgis.com),
utilizaremos el servicio [esriLoader](http://esri.github.io/angular-esri-map/docs/#/api/esri.core.factory:esriLoader)
para cargar el [widget de búsqueda](https://developers.arcgis.com/javascript/jsapi/search-amd.html) a modo de ejemplo.

[Ver cambios](https://github.com/esri-es/demos/commit/1fa6562815d3557e9c15a933e91738b4ae42c472)

```bash
git checkout -f step-3
```

## 4) Refactorizamos

Antes de seguir hacemos una pequeña refactorización

[Ver cambios](https://github.com/esri-es/demos/commit/869d5d05839082bebc5facd376ae67eb823d709c)

```bash
git checkout -f step-4
```

## 5) Añadimos POIs

Añadimos la posibilidad de marcar puntos de interés sobre el mapa

[Ver cambios](https://github.com/esri-es/demos/commit/d993e3002dbee548cacbaef0345437d367ff02e0)

```bash
git checkout -f step-5
```