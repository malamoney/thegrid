/*global require */
require.config({
	paths: {
		jquery: '../bower_components/jquery/dist/jquery',
		can: '../bower_components/canjs/amd/can',
		mustache: './lib/mustache'
	}
});

require([
	'jquery',
	'./controls/grid'
], function($, Grid) {
	'use strict';

	$(function() {
		
		window.g = new Grid("#grid", {
			roomList: [
                ["home", "about", "portfolio", "contact"],
                ["history", "resume", "zelda", "canjs"]
            ]
		});
	});
});