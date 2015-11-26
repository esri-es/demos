# Mapas inteligentes con AngularJS y ArcGIS
¿Cómo añadir la dimensión geográfica a una aplicación escrita con AngularJS? Es decir, ¿cómo podemos incrustar mapas interactivos en una aplicación y que se hable con el resto de la interfaz de usuario?

En este workshop práctica veremos cómo crear mapas interactivos con capacidad de análisis usando la [API JavaScript de ArcGIS](http://js.arcgis.com/) y las directivas del proyecto de **Github**: [angular-esri-map](https://github.com/esri/angular-esri-map)

# Pasos

## 1) Hola mundo

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

## 2) Basemaps

En este paso simplemente vamos a añadir un selector que nos permita cambiar de basemap.

```bash
git checkout -f step-1
```