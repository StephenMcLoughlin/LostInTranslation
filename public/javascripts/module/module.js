//Main module
var app = angular.module('myApp', ['ngCookies']);

//Configuration to recognise the new Angular expression syntax
app.config(function($interpolateProvider) {
  		$interpolateProvider.startSymbol('{[{');
  		$interpolateProvider.endSymbol('}]}');
	});
