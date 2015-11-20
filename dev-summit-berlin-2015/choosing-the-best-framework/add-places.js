angular.module('esri-map-example', ['esri.map', 'mgcrea.ngStrap'])
  .controller('MapController', function ($scope, $http) {
      
      // Setup the initial stat
      $scope.map = {
          center: {
            lng: 13.416286,
            lat: 52.521223
          },
          zoom: 16,
          options: {
              basemap: 'topo',
          }
      };
      $scope.place = {
        name: null,
        address: null,
        type: 'French'
      };

      // Find new address using reverse geocoder
      $scope.$watch('map.center', function() {
        $http({
          method: 'POST',
          url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode',
          headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          transformRequest: parseParams,
          data: {
            location: $scope.map.center.lng + "," + $scope.map.center.lat,
            f: 'pjson'
          }
        }).then(function successCallback(response) {
            setTimeout(function() {
              $scope.$apply(function () {
                $scope.place.address = response.data.address.Match_addr;
              });
            }, 0);
          });
       });

      // Send new place
      $scope.addPOI = function(){
        var features = [{
          attributes:{
            name: $scope.place.name,
            address: $scope.place.address,
            type: $scope.place.type
          },
          geometry:{
            x: $scope.map.center.lng,
            y: $scope.map.center.lat
          } 
        }];
        
        $http({
          method: 'POST',
          url: 'http://services.arcgis.com/Q6ZFRRvMTlsTTFuP/arcgis/rest/services/Places/FeatureServer/0/addFeatures',
          headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          transformRequest: parseParams,
          data: {
            features: JSON.stringify(features),
            f: 'json'
          }
        }).then(function successCallback(response) {
          $scope.place.name = "";
          $scope.operationSuccess = true;
          
          setTimeout(function(){
            $scope.operationSuccess = false;
            getData();
          },2000);
        });
      };

      var getData = function(){
        $http({
          method: 'GET',
          url: 'http://services.arcgis.com/Q6ZFRRvMTlsTTFuP/arcgis/rest/services/Places/FeatureServer/0/query',
          params: {
            where: "1=1",
            outFields: "*",
            f: 'json'
          }
        }).then(function successCallback(response) {
          $scope.features = response.data.features;
        });
      };
      getData();

      var parseParams = function(obj) {
        var str = [];
        for(var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
      };
  });