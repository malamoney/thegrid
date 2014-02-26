/*global require */
require.config({
	paths: {
		jquery: '../bower_components/jquery/dist/jquery',
		can: '../bower_components/canjs/amd/can'
	}
});

require([
	'jquery',
	'can/view',
	'can/route'
], function ($, can, route) {
	'use strict';

	$(function () {
		// Set up a route that maps to the `filter` attribute
		//route(':filter');

		var el = document.getElementById("grid");
		var thegrid;
		var thegridSize = 4;
		var gridSize = 8;
		var rows = 2;
		var cols = 4;
		var ok = true;

		if(!Array.isArray) {
			Array.isArray = function (vArg) {
				return vArg instanceof Array;
			};
		}

		var makeGridArray = function(a, gridSize) {
			var i, j,
				temp,
				gridArray = [];

			if(Array.isArray(a[0])) {
				for(i=0; i<gridSize; i++) {
					gridArray.push([]);
					for(j=0; j<gridSize; j++) {
						gridArray[i].push(a[i] ? a[i][j] : undefined);
					}
				}
			}
			else {
				for(i=0; i<gridSize; i++) {
					gridArray.push([]);
					for(j=0; j<gridSize; j++) {
						gridArray[i].push(a[j+(gridSize*i)]);
					}
				}
			}

			return gridArray;
		};

		var gridObj = {

		};

		var linearGrid = ["home", "about", "portfolio", "contact", "history", "resume", "zelda", "canjs"];
		console.dir(makeGridArray(linearGrid, 4));

		var grid = [
			["home", "about", "portfolio", "contact"],
			["history", "resume", "zelda", "canjs"]
		];
		console.dir(makeGridArray(grid, 4));

		var thegridData = makeGridArray(grid, 4);

		var fragment = document.createDocumentFragment();
		var gridEl = document.createElement("div");
		gridEl.className = "thegrid";

		// Move all the potential rooms to the new grid element
		while(el.childNodes.length > 0) {

			// Add a class to hide all potential rooms
			el.childNodes[0].className += " grid-room-hidden";
			gridEl.appendChild(el.childNodes[0]);
		}

		// Create the grid container
		var containerEl = document.createElement("section");
		containerEl.className = "grid-container";

		// Wrap the grid in a grid-container
		containerEl.appendChild(gridEl);

		// Set the starting room
		gridEl.className += " room-1";
		gridEl.setAttribute("data-room", "room-1");

		// Append the grid container to the document fragment
		fragment.appendChild(containerEl);

		// Attach grid-room classes to each grid element (room)
		for(var i=0; i<grid.length; i++) {
			for(var j=0; j<grid[i].length; j++) {

				var room = fragment.querySelector("#"+grid[i][j]);
				if(room) {
					room.className = room.className.replace(/\bgrid-room-hidden\b/,'');
					room.className += " grid-room room-"+(i*cols+j);
				}
				else {}
			}
		}

		el.appendChild(fragment.cloneNode(true));

		thegrid = document.getElementsByClassName("thegrid")[0];

		// Cross-browser function to determine the name of the transitionEnd event
		var whichTransitionEvent = function() {
			var t;
			var el = document.createElement('fakeelement');
			var transitions = {
				'transition':'transitionend',
				'OTransition':'oTransitionEnd',
				'MozTransition':'transitionend',
				'WebkitTransition':'webkitTransitionEnd'
			};

			for(t in transitions){
				if( el.style[t] !== undefined ){
					return transitions[t];
				}
			}
		};

		// On transistionEnd, re-enable grid movement
		thegrid.addEventListener(whichTransitionEvent(), function() {
			ok = true;
			//console.log("transition ended...");
		}, false);

		// Bind to the keydown event so we can listen for the arrow keys
		$(document).on("keydown", function(ev) {
			var charCode = (ev.which) ? ev.which : event.keyCode,
				currentRoom,
				row;

			// Check if the key pressed was an arrow key
			if(charCode >= 37 && charCode <= 40) {

				// Check if we are currently in motion and if so, prevent until motion is complete
				if(!ok) return;
				ok = false;

				//currentRoom = +gridEl.className.replace(/room-/, "");
				currentRoom = +thegrid.dataset.room.replace(/room-/, "");
				row = ~~(currentRoom/cols);
				console.log("currentRoom: " + currentRoom + "(" + row + ")");

				if(charCode === 37) {
					if(currentRoom-1 >= row*cols) {
						thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
						thegrid.className += " room-" + (currentRoom-1);
						thegrid.setAttribute("data-room", "room-" + (currentRoom-1));
					}
					else ok = true;
				}
				else if(charCode === 38) {
					if(currentRoom-cols >= 0) {
						thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
						thegrid.className += " room-" + (currentRoom-cols);
						thegrid.setAttribute("data-room", "room-" + (currentRoom-cols));
					}
					else ok = true;
				}
				else if(charCode === 39) {
					if(currentRoom+1 < (row+1)*cols) {
						thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
						thegrid.className += " room-" + (currentRoom+1);
						thegrid.setAttribute("data-room", "room-" + (currentRoom+1));
					}
					else ok = true;
				}
				else if(charCode === 40) {
					if(currentRoom+cols < gridSize) {
						thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
						thegrid.className += " room-" + (currentRoom+cols);
						thegrid.setAttribute("data-room", "room-" + (currentRoom+cols));
					}
					else ok = true;
				}
			}
		});

		// Start the router
		//route.ready();
	});
});