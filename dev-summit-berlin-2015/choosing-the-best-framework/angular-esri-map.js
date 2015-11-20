(function(angular) {
    'use strict';

    angular.module('esri.map', []);

    /**
     * @ngdoc provider
     * @name esriLoader
     * @description
     * Use `esriLoader` to lazyload the ESRI ArcGIS API or to require API modules.
     */
    angular.module('esri.map').factory('esriLoader', function ($q) {

        /**
         * Load the ESRI ArcGIS API
         *
         * @param {Object} options Send a list of options of how to load the API.
         * @param {String} options.url the url to load the ESRI API, defaults to http://js.arcgis.com/3.14compact
         * @return {Promise} Returns a $q style which is resolved once the ESRI API has loaded.
         */
        function bootstrap(options) {
          var deferred = $q.defer();

          // Don't reload API if it is already loaded
          if ( angular.isDefined(window.esri) ) {
            deferred.reject('ESRI API is already loaded.');
          }

          // Default options object to empty hash
          options = angular.isDefined(options) ? options : {};

          // Create Script Object to be loaded
          var script    = document.createElement('script');
          script.type   = 'text/javascript';
          script.src    = options.url || 'http://js.arcgis.com/3.14compact';

          // Set onload callback to resolve promise
          script.onload = function() { deferred.resolve( window.esri ); };

          document.body.appendChild(script);

          return deferred.promise;
        }

        /** Check if the ESRI ArcGIS API is loaded
         * @return {Boolean} Returns a boolean if ESRI ArcGIS ASK is, in fact, loaded
         */
        function isLoaded() {
          return angular.isDefined(window.esri);
        }

        /**
         * Load ESRI Module, this will use dojo's AMD loader
         *
         * @param {String|Array} modules A string of a module or an array of modules to be loaded.
         * @param {Function} optional callback function used to support AMD style loading, promise and callback are both add to the event loop, possible race condition.
         * @return {Promise} Returns a $q style promise which is resolved once modules are loaded
         */
        function requireModule(moduleName, callback){
          var deferred = $q.defer();

          // Throw Error if ESRI is not loaded yet
          if ( !isLoaded() ) {
            deferred.reject('Trying to call esriLoader.require(), but esri API has not been loaded yet. Run esriLoader.bootstrap() if you are lazy loading esri ArcGIS API.');
            return deferred.promise;
          }
          if (angular.isString(moduleName)) {
            require([moduleName], function (module) {

              // Check if callback exists, and execute if it does
              if ( callback && angular.isFunction(callback) ) {
                  callback(module);
              }
              deferred.resolve(module);
            });
          }
          else if (angular.isArray(moduleName)) {
            require(moduleName, function () {

              var args = Array.prototype.slice.call(arguments);

              // callback check, sends modules loaded as arguments
              if ( callback && angular.isFunction(callback) ) {
                  callback.apply(this, args);
              }

              // Grab all of the modules pass back from require callback and send as array to promise.
              deferred.resolve(args);
            });
          }
          else {
            deferred.reject('An Array<String> or String is required to load modules.');
          }

          return deferred.promise;
        }

        // Return list of aformentioned functions
        return {
            bootstrap: bootstrap,
            isLoaded:  isLoaded,
            require:   requireModule
        };
    });

})(angular);

(function (angular) {
  'use strict';

  angular.module('esri.map').service('esriRegistry', function ($q) {
    var registry = {};

    return {
      _register: function(name, promise){
        // if there isn't a promise in the registry yet make one...
        // this is the case where a directive is nested higher then the controller
        // needing the instance
        if (!registry[name]){
          registry[name] = $q.defer();
        }

        var instance = registry[name];

        // when the promise from the directive is rejected/resolved
        // reject/resolve the promise in the registry with the appropriate value
        promise.then(function(arg){
          instance.resolve(arg);
          return arg;
        }, function(arg){
          instance.reject(arg);
          return arg;
        });

        // return a function to "deregister" the promise
        // by deleting it from the registry
        return function(){
          delete registry[name];
        };
      },

      get: function(name){
        // is something is already in the registry return its promise ASAP
        // this is the case where you might want to get a registry item in an
        // event handler
        if(registry[name]){
          return registry[name].promise;
        }

        // if we dont already have a registry item create one. This covers the
        // case where the directive is nested inside the controler. The parent
        // controller will be executed and gets a promise that will be resolved
        // later when the item is registered
        var deferred = $q.defer();

        registry[name] = deferred;

        return deferred.promise;
      }
    };
  });

})(angular);

(function (angular) {
  'use strict';

  angular.module('esri.map').factory('esriMapUtils', function ($q, esriLoader) {

    // construct Extent if object is not already an instance
    // e.g. if the controller or HTML view are only providing JSON
    function objectToExtent(extent, Extent) {
        if (extent.declaredClass === 'esri.geometry.Extent') {
            return extent;
        } else {
            return new Extent(extent);
        }
    }

    // stateless utility service
    var service = {};

    // add a custom basemap definition to be used by maps
    service.addCustomBasemap = function(name, basemapDefinition) {
        return esriLoader.require('esri/basemaps').then(function(esriBasemaps) {
            var baseMapLayers = basemapDefinition.baseMapLayers;
            if (!angular.isArray(baseMapLayers) && angular.isArray(basemapDefinition.urls)) {
                baseMapLayers = basemapDefinition.urls.map(function (url) {
                    return {
                        url: url
                    };
                });
            }
            if (angular.isArray(baseMapLayers)) {
                esriBasemaps[name] = {
                    baseMapLayers: baseMapLayers,
                    thumbnailUrl: basemapDefinition.thumbnailUrl,
                    title: basemapDefinition.title
                };
            }
            return esriBasemaps;
        });
    };

    // create a new map at an element w/ the given id
    service.createMap = function(elementId, mapOptions) {
        return esriLoader.require(['esri/map', 'esri/geometry/Extent']).then(function(esriModules) {
            var Map = esriModules[0];
            var Extent = esriModules[1];

            // construct optional Extent for mapOptions
            if (mapOptions.hasOwnProperty('extent')) {
                mapOptions.extent = objectToExtent(mapOptions.extent, Extent);
            }

            // create a new map object and
            // resolve the promise with the map
            return new Map(elementId, mapOptions);
        });
    };

    // TODO: would be better if we didn't have to pass mapController
    // create a new map from a web map at an element w/ the given id
    service.createWebMap = function(webmapId, elementId, mapOptions, mapController) {
        // this deferred will be resolved with the map
        // NOTE: wrapping in $q deferred to avoid injecting
        // dojo/Deferred into promise chain by returning argisUtils.createMap()
        var mapDeferred = $q.defer();

        esriLoader.require(['esri/arcgis/utils', 'esri/geometry/Extent'], function(arcgisUtils, Extent) {

            // construct optional Extent for mapOptions
            if (mapOptions.hasOwnProperty('extent')) {
                mapOptions.extent = objectToExtent(mapOptions.extent, Extent);
            }

            // load map object from web map
            arcgisUtils.createMap(webmapId, elementId, {
                mapOptions: mapOptions
            }).then(function(response) {
                // get layer infos for legend
                mapController.layerInfos = arcgisUtils.getLegendLayers(response);
                // get item info (map title, etc)
                mapController.itemInfo = response.itemInfo;
                // resolve the promise with the map and additional info
                mapDeferred.resolve(response.map);
            });
        });

        // return the map deferred's promise
        return mapDeferred.promise;
    };

    return service;
  });

})(angular);

(function (angular) {
  'use strict';

  angular.module('esri.map').factory('esriLayerUtils', function (esriLoader) {

    // test if a string value (i.e. directive attribute value) is true
    function isTrue(val) {
        return val === true || val === 'true';
    }

    // parse array of visible layer ids from a string
    function parseVisibleLayers(val) {
        var visibleLayers;
        if (typeof val === 'string') {
            visibleLayers = [];
            val.split(',').forEach(function(layerId) {
                var n = parseInt(layerId);
                if(!isNaN(n)) {
                    visibleLayers.push(n);
                }
            });
        }
        return visibleLayers;
    }

    // layerOptions.infoTemplate expects one of the following:
    //  1. [title <String | Function>, content <String | Function>]
    //  2. {title: <String | Function>, content: <String | Function>}
    //  3. a valid Esri JSAPI InfoTemplate
    function objectToInfoTemplate(infoTemplate, InfoTemplate) {
        // only attempt to construct if a valid InfoTemplate wasn't already passed in
        if (infoTemplate.declaredClass === 'esri.InfoTemplate') {
            return infoTemplate;
        } else {
            // construct infoTemplate from object, using 2 args style:
            //  https://developers.arcgis.com/javascript/jsapi/infotemplate-amd.html#infotemplate2
            if (angular.isArray(infoTemplate) && infoTemplate.length === 2) {
                return new InfoTemplate(infoTemplate[0], infoTemplate[1]);
            } else {
                return new InfoTemplate(infoTemplate.title, infoTemplate.content);
            }
        }
    }

    // stateless utility service
    var service = {};

    // get common layer options from layer controller properties
    service.getLayerOptions = function (layerController) {

        // read options passed in as either a JSON string expression
        // or as a function bound object
        var layerOptions = layerController.layerOptions() || {};

        // visible takes precedence over layerOptions.visible
        if (angular.isDefined(layerController.visible)) {
            layerOptions.visible = isTrue(layerController.visible);
        }

        // opacity takes precedence over layerOptions.opacity
        if (layerController.opacity) {
            layerOptions.opacity = Number(layerController.opacity);
        }

        return layerOptions;
    };

    // create a feature layer
    service.createFeatureLayer = function(url, layerOptions) {
        return esriLoader.require(['esri/layers/FeatureLayer', 'esri/InfoTemplate']).then(function(esriModules) {
            var FeatureLayer = esriModules[0];
            var InfoTemplate = esriModules[1];

            // normalize info template defined in layerOptions.infoTemplate
            // or nested esriLayerOption directive to be instance of esri/InfoTemplate
            // and pass to layer constructor in layerOptions
            if (layerOptions.infoTemplate) {
                layerOptions.infoTemplate = objectToInfoTemplate(layerOptions.infoTemplate, InfoTemplate);
            }

            // layerOptions.mode expects a FeatureLayer constant name as a <String>
            // https://developers.arcgis.com/javascript/jsapi/featurelayer-amd.html#constants
            if (layerOptions.hasOwnProperty('mode')) {
                // look up and convert to the appropriate <Number> value
                layerOptions.mode = FeatureLayer[layerOptions.mode];
            }

            return new FeatureLayer(url, layerOptions);
        });
    };

    // create a dynamic service layer
    service.createDynamicMapServiceLayer = function(url, layerOptions, visibleLayers) {
        return esriLoader.require(['esri/layers/ArcGISDynamicMapServiceLayer', 'esri/InfoTemplate', 'esri/layers/ImageParameters']).then(function (esriModules) {
            var ArcGISDynamicMapServiceLayer = esriModules[0];
            var InfoTemplate = esriModules[1];
            var ImageParameters = esriModules[2];
            var layer;

            // normalize info templates defined in layerOptions.infoTemplates
            // or nested esriLayerOption directives to be instances of esri/InfoTemplate
            // and pass to layer constructor in layerOptions
            if (layerOptions.infoTemplates) {
                for (var layerId in layerOptions.infoTemplates) {
                    if (layerOptions.infoTemplates.hasOwnProperty(layerId)) {
                        layerOptions.infoTemplates[layerId].infoTemplate = objectToInfoTemplate(layerOptions.infoTemplates[layerId].infoTemplate, InfoTemplate);
                    }
                }
            }

            // check for imageParameters property and
            // convert into ImageParameters() if needed
            if (angular.isObject(layerOptions.imageParameters)) {
                if (layerOptions.imageParameters.declaredClass !== 'esri.layers.ImageParameters') {
                    var imageParameters = new ImageParameters();
                    for (var key in layerOptions.imageParameters) {
                        if (layerOptions.imageParameters.hasOwnProperty(key)) {
                            // TODO: may want to conver timeExent to new TimeExtent()
                            // also not handling conversion for bbox, imageSpatialReference, nor layerTimeOptions
                            imageParameters[key] = layerOptions.imageParameters[key];
                        }
                    }
                    layerOptions.imageParameters = imageParameters;
                }
            }

            // create the layer object
            layer = new ArcGISDynamicMapServiceLayer(url, layerOptions);

            // set visible layers if passed as attribute
            if (visibleLayers) {
                layer.setVisibleLayers(parseVisibleLayers(visibleLayers));
            }

            return layer;
        });
    };

    // create an InfoTemplate object from JSON
    service.createInfoTemplate = function(infoTemplate) {
        return esriLoader.require('esri/InfoTemplate').then(function(InfoTemplate) {
            return objectToInfoTemplate(infoTemplate, InfoTemplate);
        });
    };

    // get layer info from layer and directive attributes
    service.getLayerInfo = function(layer, attrs) {
        return {
            title: attrs.title || layer.name,
            layer: layer,
            // TODO: are these the right params to send
            hideLayers: (attrs.hideLayers) ? attrs.hideLayers.split(',') : undefined,
            defaultSymbol: (attrs.defaultSymbol) ? JSON.parse(attrs.defaultSymbol) : true
        };
    };

    // bind directive attributes to layer properties and events
    service.bindLayerEvents = function(scope, attrs, layer, mapController) {

        // call load handler (if any)
        if (attrs.load) {
            if (layer.loaded) {
                // layer is already loaded
                // make layer object available to caller immediately
                scope.layerCtrl.load()(layer);
            } else {
                // layer is not yet loaded
                // wait for load event, and then make layer object available
                layer.on('load', function() {
                    scope.$apply(function() {
                        scope.layerCtrl.load()(layer);
                    });
                });
            }
        }

        // call updateEnd handler (if any)
        if (attrs.updateEnd) {
            layer.on('update-end', function(e) {
                scope.$apply(function() {
                    scope.layerCtrl.updateEnd()(e);
                });
            });
        }

        // watch the scope's visible property for changes
        // set the visibility of the feature layer
        scope.$watch('layerCtrl.visible', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                layer.setVisibility(isTrue(newVal));
            }
        });

        // watch the scope's opacity property for changes
        // set the opacity of the feature layer
        scope.$watch('layerCtrl.opacity', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                layer.setOpacity(Number(newVal));
            }
        });

        // remove the layer from the map when the layer scope is destroyed
        scope.$on('$destroy', function() {
            mapController.removeLayer(layer);
        });
    };

    return service;
  });

})(angular);

(function(angular) {
    'use strict';

    angular.module('esri.map').controller('esriMapController', function EsriMapController($attrs, $timeout, esriMapUtils, esriRegistry) {

        // update two-way bound scope properties based on map state
        function updateCenterAndZoom(scope, map) {
            var geoCenter = map.geographicExtent && map.geographicExtent.getCenter();
            if (geoCenter) {
                geoCenter = geoCenter.normalize();
                scope.center = {
                    lat: geoCenter.y,
                    lng: geoCenter.x
                };
            }
            scope.zoom = map.getZoom();
        }

        var attrs = $attrs;

        // this deferred will be resolved with the map
        var mapPromise;

        // get map options from controller properties
        this.getMapOptions = function() {

            // read options passed in as either a JSON string expression
            // or as a function bound object
            var mapOptions = this.mapOptions() || {};

            // check for 1 way bound properties (basemap)
            // basemap takes precedence over mapOptions.basemap
            if (this.basemap) {
                mapOptions.basemap = this.basemap;
            }

            // check for 2 way bound properties (center and zoom)
            // center takes precedence over mapOptions.center
            if (this.center) {
                if (this.center.lng && this.center.lat) {
                    mapOptions.center = [this.center.lng, this.center.lat];
                } else {
                    mapOptions.center = this.center;
                }
            }

            // zoom takes precedence over mapOptions.zoom
            if (this.zoom) {
                mapOptions.zoom = this.zoom;
            }

            return mapOptions;
        };

        // method returns the promise that will be resolved with the map
        this.getMap = function() {
            return mapPromise;
        };

        // adds the layer, returns the promise that will be resolved with the result of map.addLayer
        this.addLayer = function(layer, index) {
            // layer: valid JSAPI layer
            // index: optional <Number>; likely only used internally by, for example, esriFeatureLayer
            return this.getMap().then(function(map) {
                return map.addLayer(layer, index);
            });
        };

        // support removing layers, e.g. when esriFeatureLayer goes out of scope
        this.removeLayer = function (layer) {
            return this.getMap().then(function (map) {
                return map.removeLayer(layer);
            });
        };

        // array to store layer info, needed for legend
        this.addLayerInfo = function(lyrInfo) {
            if (!this.layerInfos) {
                this.layerInfos = [lyrInfo];
            } else {
                this.layerInfos.unshift(lyrInfo);
            }
        };
        this.getLayerInfos = function() {
            return this.layerInfos;
        };

        // update scope in response to map events and
        // update map in response to changes in scope properties
        this.bindMapEvents = function(scope, attrs) {
            var self = this;

            // get the map once it's loaded
            this.getMap().then(function(map) {
                if (map.loaded) {
                    // map already loaded, we need to
                    // update two-way bound scope properties
                    // updateCenterAndZoom(scope, map);
                    updateCenterAndZoom(self, map);
                    // make map object available to caller
                    // by calling the load event handler
                    if (attrs.load) {
                        self.load()(map);
                    }
                } else {
                    // map is not yet loaded, this means that
                    // two-way bound scope properties
                    // will be updated by extent-change handler below
                    // so don't need to update them here
                    // just set up a handler for the map load event (if any)
                    if (attrs.load) {
                        map.on('load', function() {
                            scope.$apply(function() {
                                self.load()(map);
                            });
                        });
                    }
                }

                // listen for changes to map extent and
                // call extent-change handler (if any)
                // also update scope.center and scope.zoom
                map.on('extent-change', function(e) {
                    if (attrs.extentChange) {
                        self.extentChange()(e);
                    }
                    // prevent circular updates between $watch and $apply
                    if (self.inUpdateCycle) {
                        return;
                    }
                    self.inUpdateCycle = true;
                    scope.$apply(function() {
                        // update scope properties
                        updateCenterAndZoom(self, map);
                        $timeout(function() {
                            // this will be executed after the $digest cycle
                            self.inUpdateCycle = false;
                        }, 0);
                    });
                });

                // listen for changes to scope.basemap and update map
                scope.$watch('mapCtrl.basemap', function(newBasemap, oldBasemap) {
                    if (map.loaded && newBasemap !== oldBasemap) {
                        map.setBasemap(newBasemap);
                    }
                });

                // listen for changes to scope.center and scope.zoom and update map
                self.inUpdateCycle = false;
                if (!angular.isUndefined(attrs.center) || !angular.isUndefined(attrs.zoom)) {
                    scope.$watchGroup(['mapCtrl.center.lng', 'mapCtrl.center.lat', 'mapCtrl.zoom'], function(newCenterZoom/*, oldCenterZoom*/) {
                        if (self.inUpdateCycle) {
                            return;
                        }
                        if (newCenterZoom[0] !== '' && newCenterZoom[1] !== '' && newCenterZoom[2] !== '') {
                            // prevent circular updates between $watch and $apply
                            self.inUpdateCycle = true;
                            map.centerAndZoom([newCenterZoom[0], newCenterZoom[1]], newCenterZoom[2]).then(function() {
                                self.inUpdateCycle = false;
                            });
                        }
                    });
                }

                // clean up
                scope.$on('$destroy', function() {
                    if (self.deregister) {
                        self.deregister();
                    }
                    map.destroy();
                });
            });
        };

        // initialize the map
        if (attrs.webmapId) {
            // load map object from web map
            mapPromise = esriMapUtils.createWebMap(attrs.webmapId, attrs.id, this.getMapOptions(), this);
        } else {
            // create a new map object
            mapPromise = esriMapUtils.createMap(attrs.id, this.getMapOptions());
        }

        // add this map to the registry and get a
        // handle to deregister the map when it's destroyed
        if (attrs.registerAs) {
            this.deregister = esriRegistry._register(attrs.registerAs, mapPromise);
        }
    });

})(angular);

(function(angular) {
    'use strict';

    angular.module('esri.map').directive('esriMap', function() {

        return {
            // element only
            restrict: 'E',

            // isolate scope
            scope: {
                // two-way binding for center/zoom
                // because map pan/zoom can change these
                center: '=?',
                zoom: '=?',
                itemInfo: '=?',
                // one-way binding for other properties
                basemap: '@',
                // function binding for event handlers
                load: '&',
                extentChange: '&',
                // function binding for reading object hash from attribute string
                // or from scope object property
                // see Example 7 here: https://gist.github.com/CMCDragonkai/6282750
                mapOptions: '&'
            },

            controllerAs: 'mapCtrl',

            bindToController: true,

            // replace tag with div with same id
            compile: function($element, $attrs) {

                // remove the id attribute from the main element
                $element.removeAttr('id');

                // append a new div inside this element, this is where we will create our map
                $element.append('<div id=' + $attrs.id + '></div>');

                // since we are using compile we need to return our linker function
                // the 'link' function handles how our directive responds to changes in $scope
                return function(scope, element, attrs, controller) {

                    // update scope in response to map events and
                    // update map in response to changes in scope properties
                    controller.bindMapEvents(scope, attrs);

                };
            },

            // directive api
            controller: 'esriMapController'
        };
    });

})(angular);

(function(angular) {
    'use strict';

    angular.module('esri.map').controller('esriFeatureLayerController', function EsriFeatureLayerController(esriLayerUtils) {

        var layerPromise;

        // get feature layer options from layer controller properties
        this.getLayerOptions = function() {
            var layerOptions = esriLayerUtils.getLayerOptions(this);
            // definitionExpression takes precedence over layerOptions.definitionExpression
            if (this.definitionExpression) {
                layerOptions.definitionExpression = this.definitionExpression;
            }

            return layerOptions;
        };

        // return the defered that will be resolved with the feature layer
        this.getLayer = function() {
            return layerPromise;
        };

        // set info template once layer has been loaded
        this.setInfoTemplate = function(infoTemplate) {
            return this.getLayer().then(function(layer) {
                return esriLayerUtils.createInfoTemplate(infoTemplate).then(function(infoTemplateObject) {
                    layer.setInfoTemplate(infoTemplateObject);
                    return infoTemplateObject;
                });
            });
        };

        // create the layer
        layerPromise = esriLayerUtils.createFeatureLayer(this.url, this.getLayerOptions());
    });

})(angular);

(function(angular) {
    'use strict';

    angular.module('esri.map').directive('esriFeatureLayer', function(esriLayerUtils) {
        // this object will tell angular how our directive behaves
        return {
            // only allow esriFeatureLayer to be used as an element (<esri-feature-layer>)
            restrict: 'E',

            // require the esriFeatureLayer to have its own controller as well an esriMap controller
            // you can access these controllers in the link function
            require: ['esriFeatureLayer', '^esriMap'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            // isolate scope for feature layer so it can be added/removed dynamically
            scope: {
                url: '@',
                visible: '@?',
                opacity: '@?',
                definitionExpression: '@?',
                // function binding for event handlers
                load: '&',
                updateEnd: '&',
                // function binding for reading object hash from attribute string
                // or from scope object property
                // see Example 7 here: https://gist.github.com/CMCDragonkai/6282750
                layerOptions: '&'
            },

            controllerAs: 'layerCtrl',

            bindToController: true,

            // define an interface for working with this directive
            controller: 'esriFeatureLayerController',

            // now we can link our directive to the scope, but we can also add it to the map
            link: function(scope, element, attrs, controllers) {
                // controllers is now an array of the controllers from the 'require' option
                var layerController = controllers[0];
                var mapController = controllers[1];

                // get the layer object
                layerController.getLayer().then(function(layer){
                    // get layer info from layer object and directive attributes
                    var layerInfo = esriLayerUtils.getLayerInfo(layer, attrs);

                    // add the layer to the map
                    mapController.addLayer(layer, 0);
                    mapController.addLayerInfo(layerInfo);

                    // bind directive attributes to layer properties and events
                    esriLayerUtils.bindLayerEvents(scope, attrs, layer, mapController);

                    // additional directive attribute binding specific to this type of layer

                    // watch the scope's definitionExpression property for changes
                    // set the definitionExpression of the feature layer
                    scope.$watch('layerCtrl.definitionExpression', function(newVal, oldVal) {
                        if (newVal !== oldVal) {
                            layer.setDefinitionExpression(newVal);
                        }
                    });
                });
            }
        };
    });

})(angular);

(function(angular) {
    'use strict';

    angular.module('esri.map').controller('esriDynamicMapServiceLayerController', function EsriDynamicMapServiceLayerController(esriLayerUtils) {

        var layerPromise;

        // get feature layer options from layer controller properties
        this.getLayerOptions = function() {
            return esriLayerUtils.getLayerOptions(this);
        };

        // return the defered that will be resolved with the dynamic layer
        this.getLayer = function () {
            return layerPromise;
        };

        // set the info template for a layer
        this.setInfoTemplate = function(layerId, infoTemplate) {
            return this.getLayer().then(function(layer) {
                return esriLayerUtils.createInfoTemplate(infoTemplate).then(function(infoTemplateObject) {
                    // check if layer has info templates defined
                    var infoTemplates = layer.infoTemplates;
                    if (!angular.isObject(infoTemplates)) {
                        // create a new info templates hash
                        infoTemplates = {};
                    }
                    // set the info template for sublayer
                    // NOTE: ignoring layerUrl and resourceInfo for now
                    // https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#arcgisdynamicmapservicelayer1
                    infoTemplates[layerId] = {
                        infoTemplate: infoTemplateObject
                    };
                    layer.setInfoTemplates(infoTemplates);
                    return infoTemplates;
                });
            });
        };

        // create the layer
        layerPromise = esriLayerUtils.createDynamicMapServiceLayer(this.url, this.getLayerOptions(), this.visibleLayers);
    });

})(angular);

(function (angular) {
    'use strict';

    angular.module('esri.map').directive('esriDynamicMapServiceLayer', function (esriLayerUtils) {
        // this object will tell angular how our directive behaves
        return {
            // only allow esriDynamicMapServiceLayer to be used as an element (<esri-dynamic-map-service-layer>)
            restrict: 'E',

            // require the esriDynamicMapServiceLayer to have its own controller as well an esriMap controller
            // you can access these controllers in the link function
            require: ['esriDynamicMapServiceLayer', '^esriMap'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            // isolate scope for dynamic layer so it can be added/removed dynamically
            scope: {
                url: '@',
                visible: '@?',
                opacity: '@?',
                visibleLayers: '@?',
                // function binding for event handlers
                load: '&',
                updateEnd: '&',
                // function binding for reading object hash from attribute string
                // or from scope object property
                // see Example 7 here: https://gist.github.com/CMCDragonkai/6282750
                layerOptions: '&'
            },

            controllerAs: 'layerCtrl',

            bindToController: true,

            // define an interface for working with this directive
            controller: 'esriDynamicMapServiceLayerController',

            // now we can link our directive to the scope, but we can also add it to the map..
            link: function (scope, element, attrs, controllers) {
                // controllers is now an array of the controllers from the 'require' option
                var layerController = controllers[0];
                var mapController = controllers[1];

                // get the layer object
                layerController.getLayer().then(function(layer){

                    // get layer info from layer object and directive attributes
                    var layerInfo = esriLayerUtils.getLayerInfo(layer, attrs);

                    // add the layer to the map
                    mapController.addLayer(layer);
                    mapController.addLayerInfo(layerInfo);

                    // bind directive attributes to layer properties and events
                    esriLayerUtils.bindLayerEvents(scope, attrs, layer, mapController);
                });
            }
        };
    });

})(angular);

(function (angular) {
    'use strict';

    angular.module('esri.map').directive('esriInfoTemplate', function () {
        // this object will tell angular how our directive behaves
        return {
            // only allow esriInfoTemplate to be used as an element (<esri-feature-layer>)
            restrict: 'E',

            // require the esriInfoTemplate to have its own controller as well an esriMap controller
            // you can access these controllers in the link function
            require: ['?esriInfoTemplate', '?^esriDynamicMapServiceLayer', '?^esriFeatureLayer'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            compile: function($element) {

                // get info template content from element inner HTML
                var content = $element.html();

                // clear element inner HTML
                $element.html('');

                // since we are using compile we need to return our linker function
                // the 'link' function handles how our directive responds to changes in $scope
                return function (scope, element, attrs, controllers) {
                    // controllers is now an array of the controllers from the 'require' option
                    // var templateController = controllers[0];
                    var dynamicMapServiceLayerController = controllers[1];
                    var featureLayerController = controllers[2];
                    
                    if (dynamicMapServiceLayerController) {
                        dynamicMapServiceLayerController.setInfoTemplate(attrs.layerId, {
                            title: attrs.title,
                            content: content
                        });
                    }
                    
                    if (featureLayerController) {
                        featureLayerController.setInfoTemplate({
                            title: attrs.title,
                            content: content
                        });
                    }
                };
            }
        };
    });

})(angular);

(function(angular) {
  'use strict';

  /**
   * @ngdoc directive
   * @name esriApp.directive:esriLegend
   * @description
   * # esriLegend
   */
  angular.module('esri.map')
    .directive('esriLegend', function($q, esriLoader) {
      return {
        //run last
        priority: -10,
        restrict: 'EA',
        // require the esriMap controller
        // you can access these controllers in the link function
        require: ['?esriLegend', '^esriMap'],
        replace: true,

        scope: {},
        controllerAs: 'legendCtrl',
        bindToController: true,

        controller: function() {},

        // now we can link our directive to the scope, but we can also add it to the map
        link: function(scope, element, attrs, controllers) {

          // controllers is now an array of the controllers from the 'require' option
          // var legendController = controllers[0];
          var mapController = controllers[1];
          var targetId = attrs.targetId || attrs.id;
          var legendDeferred = $q.defer();

          esriLoader.require(['esri/dijit/Legend'], function(Legend) {
            mapController.getMap().then(function(map) {
              var legend;

              var options = {
                map: map
              };

              var layerInfos = mapController.getLayerInfos();
              if (layerInfos) {
                options.layerInfos = layerInfos;
              }

              legend = new Legend(options, targetId);
              legend.startup();

              scope.$watchCollection(function() {
                return mapController.getLayerInfos();
              }, function(newValue /*, oldValue, scope*/ ) {
                legend.refresh(newValue);
              });
              
              legendDeferred.resolve(legend);

              scope.$on('$destroy', function() {
                legend.destroy();
              });
            });
          });
        }
      };
    });

})(angular);
