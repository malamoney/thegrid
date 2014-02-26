/*global require */
require.config({
	paths: {
		jquery: '../bower_components/jquery/dist/jquery',
		can: '../bower_components/canjs/amd/can'
	}
});

require([
	'jquery',
	'can/control',
	'can/route',
	'./controls/grid'
], function($, can, route, Grid) {
	'use strict';

	$(function() {
		// Set up a route that maps to the `filter` attribute
		//route(':filter');
		
		window.g = new Grid("#grid", {
			roomList: [
                ["home", "about", "portfolio", "contact"],
                ["history", "resume", "zelda", "canjs"]
            ]
		});

		// Start the router
		//route.ready();
	});
});