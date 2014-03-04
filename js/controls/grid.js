define([
    'can/control',
    'can/map',
    'can/route',
    'mustache!../../views/thegrid',
    'can/compute',
    'can/control/route'
], function(Control, Map, route, gridStache) {
    'use strict';

    // Set up a route that maps to the `filter` attribute
    route(':room');

    /*can.Mustache.registerHelper("frag", function(frag) {
        return function(el) {
            el.parentNode.replaceChild(frag, el);
        };
    });*/

    /**
     * Convert an array of grid data to the grid format required by thegrid
     * @param  {Array} gridData         array of grid data
     * @param  {Number} gridSize        number of rows and columns in thegrid
     * @return {Array}                  formatted grid data
     */
    var _makeGridInternals = function(gridData, gridSize) {
        var i, j,
            temp,
            gridArray = [],
            gridLookup = {};

        // Is gridData an array of arrays?
        if(can.isArray(gridData[0])) {
            for(i=0; i<gridSize; i++) {
                gridArray.push([]);
                for(j=0; j<gridSize; j++) {
                    gridArray[i].push(gridData[i] ? new can.Map({
                        gid: gridData[i][j]
                    }) : undefined);

                    if(gridData[i]) {
                        gridLookup["#"+gridData[i][j]] = {
                            y: i,
                            x: j
                        };
                    }
                }
            }
        }
        else {
            for(i=0; i<gridSize; i++) {
                gridArray.push([]);
                for(j=0; j<gridSize; j++) {
                    gridArray[i].push(new can.Map({
                        gid: gridData[j+(gridSize*i)]
                    }));
                    if(gridData[j+(gridSize*i)]) {
                        gridLookup["#"+gridData[j+(gridSize*i)]] = {
                            y: i,
                            x: j
                        };
                    }
                }
            }
        }

        return {
            gridData: gridArray,
            gridLookup: gridLookup
        };
    };

    /**
     * Cross-browser function to determine the name of the transitionEnd event
     * @return {String} transitionend event
     */
    var _whichTransitionEvent = function() {
        var t,
            el = document.createElement('fakeelement'),
            transitions = {
                'transition':'transitionend',
                'OTransition':'oTransitionEnd',
                'MozTransition':'transitionend',
                'WebkitTransition':'webkitTransitionEnd'
            };

        for(t in transitions){
            if(el.style[t] !== undefined ){
                return transitions[t];
            }
        }
    };

    return Control.extend({
        defaults: {
            gridSize: 4,
            arrowKeysTargetEl: $(document),
            roomList: [],
            startingRoom: 0,
            wrapping: 0,
            diagonal: 0,
            warping: 0
        }
    },{
        init: function() {
            var self = this,
                el = this.element[0],
                gridData,
                fragment,
                room,
                roomData;

            this.gridInternals = _makeGridInternals(this.options.roomList, this.options.gridSize);
            gridData = this.gridInternals.gridData;

            // Create the state
            this.state = new can.Map({
                ready: 1,
                currentCoordinates: this._getCoordinates(this.options.startingRoom),
                currentRoom: can.compute(function() {
                    return self._getRoomFromCoordinates(self.state.attr("currentCoordinates"));
                }),
                currentClass: can.compute(function() {
                    return "room-" + self.state.currentRoom();
                })
            });

            // Create a document fragment to contain the grid
            fragment = document.createDocumentFragment("div");

            // Move all the potential rooms to the new grid element
            while(this.element.children().length > 0) {
                $(this.element.children()[0]).addClass("grid-room-hidden");
                fragment.appendChild(this.element.children()[0]);
            }

            // Setup all the grid rooms
            for(var i=0; i<gridData.length; i++) {
                for(var j=0; j<gridData[i].length; j++) {

                    if(gridData[i][j]) {
                        room = fragment.querySelector("#" + gridData[i][j].attr("gid"));
                        if(room) {
                            $(room).removeClass("grid-room-hidden").addClass("grid-room room-"+(i*this.options.gridSize+j));
                        }
                        else {}
                    }
                }
            }

            // Attach the grid template
            this.element.html(gridStache(this.state));

            // Save a reference to thegrid and append the grid contents
            this.thegrid = this.element.find(".thegrid");
            this.thegrid.append(fragment.cloneNode(true));

            // Add the grid element and transitionend event to options and rebind event handlers
            this.options.gridEl = this.thegrid;
            this.options.transitionEndEvent = _whichTransitionEvent();
            this.on();

            // Start the router
            route.ready();

            roomData = this._getRoomDataFromCoordinates(this._getCoordinates(this.options.startingRoom));
            if(roomData) {
                can.route.attr("room", roomData.attr("gid"));
            }
        },

        /**
         * On transistionEnd, re-enable grid movement
         * @param  {HTMLElement} el  thegrid element
         * @param  {jQuery.Event} ev transitionend event
         */
        "{gridEl} {transitionEndEvent}": function(el, ev) {
            this.state.attr("ready", 1);
        },

        /**
         * Get grid coordinates for a given room number
         * @param  {Number} room Room number
         * @return {Object}      Coordinates
         */
        _getCoordinates: function(room) {
            return {
                y: ~~(room/this.options.gridSize),
                x: room % this.options.gridSize
            };
        },

        _getRoomDataFromCoordinates: function(coordinates) {
            return this.gridInternals.gridData[coordinates.y][coordinates.x];
        },

        /**
         * Get grid room number at given coordinates
         * @param  {Object} coordinates Coordinates
         * @return {Number}             Room number
         */
        _getRoomFromCoordinates: function(coordinates) {
            return (this.options.gridSize * coordinates.y) + coordinates.x;
        },

        /**
         * Get the coordinates to move to given a direction
         * @param  {Object} from      From coordinates
         * @param  {String} direction Direction to move
         * @return {Object}           Coordinates to move to
         */
        _getMoveToCoordinates: function(from, direction) {
            var coordinates,
                gridSize = this.options.gridSize;

            switch(direction) {
                case "up":
                    coordinates = {
                        y: (from.y+(gridSize-1)) % gridSize,
                        x: from.x
                    };
                    break;
                case "down":
                    coordinates = {
                        y: (from.y+(gridSize+1)) % gridSize,
                        x: from.x
                    };
                    break;
                case "left":
                    coordinates = {
                        y: from.y,
                        x: (from.x+(gridSize-1)) % gridSize
                    };
                    break;
                case "right":
                    coordinates = {
                        y: from.y,
                        x: (from.x+(gridSize+1)) % gridSize
                    };
                    break;
                default:
                    coordinates = from;
                    break;
            }
            return coordinates;
        },

        /**
         * Move in a specified direction
         * @param  {String} direction Direction to move
         * @return {Boolean}          Whether the move was successful
         */
        _moveDirection: function(direction) {
            var currentCoordinates = this.state.attr("currentCoordinates"),
                moveToCoords = this._getMoveToCoordinates(this.state.attr("currentCoordinates"), direction);

            return this._move(currentCoordinates, moveToCoords);
        },

        /**
         * Move current location on grid
         * @param  {String} direction Direction to move
         * @return {Boolean}          Whether move was successfull
         */
        _move: function(fromCoords, toCoords) {
            var moveToRoom = this._getRoomFromCoordinates(toCoords);

            // Check if we are allowed to move from the current location to the request location
            if(this._isMoveAllowed(fromCoords, moveToRoom)) {
                this.state.attr("currentCoordinates", this._getCoordinates(moveToRoom));
                return 1;
            }
            else {
                console.log("move not allowed");
                this.state.attr("ready", 1);
                return 0;
            }
        },

        /**
         * Get an array of room numbers to which you can move to from a given set of coordinates
         * @param  {Object} coordinates Room coordinates
         * @return {Array}              List of allowed rooms you can move to
         */
        _getAllowedMoves: function(coordinates) {
            var allowedMoves = [],
                gridSize = this.options.gridSize,
                wrapping = this.options.wrapping,
                roomData = this.gridInternals.gridData[coordinates.y][coordinates.x];

            // Check if we've already cached the allowed moves
            if(roomData && roomData.attr("allowedMoves")) {
                return roomData.attr("allowedMoves");
            }

            if(coordinates.x > 0 || (coordinates.x === 0 && wrapping)) {
                allowedMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(coordinates, "left")));
            }
            if(coordinates.x < (gridSize-1) || (coordinates.x === (gridSize-1) && wrapping)) {
                allowedMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(coordinates, "right")));
            }
            if(coordinates.y > 0 || (coordinates.y === 0 && wrapping)) {
                allowedMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(coordinates, "up")));
            }
            if(coordinates.y < (gridSize-1) || (coordinates.y === (gridSize-1) && wrapping)) {
                allowedMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(coordinates, "down")));
            }

            // Cache the results so we don't have to do this again next time
            if(roomData) {
                roomData.attr("allowedMoves", allowedMoves);
            }

            return allowedMoves;
        },

        /**
         * Check if a specific move is allowed
         * @param  {Object}  from Coordinates of starting room
         * @param  {Number}  to   Room number of room we want to move to
         * @return {Boolean}      Whether move is allowed
         */
        _isMoveAllowed: function(from, to) {
            return ~(can.inArray(to, this._getAllowedMoves(from)));
        },

        /**
         * Bind to the keydown event so we can listen for the arrow keys
         * @param  {HTMLElement} el     The element the keydown event was triggered on
         * @param  {jQuery.Event} ev    keydown event
         */
        "{arrowKeysTargetEl} keydown": function(el, ev) {
            var charCode = (ev.which) ? ev.which : event.keyCode;

            // Check if the key pressed was an arrow key
            if(charCode >= 37 && charCode <= 40) {

                // Check if we are currently in motion and if so, prevent until motion is complete
                if(!this.state.attr("ready")) return;
                this.state.attr("ready", 0);

                if(charCode === 37) {
                    this._moveDirection("left");
                }
                else if(charCode === 38) {
                    this._moveDirection("up");
                }
                else if(charCode === 39) {
                    this._moveDirection("right");
                }
                else if(charCode === 40) {
                    this._moveDirection("down");
                }
            }
        },

        /**
         * Listen for changes to the room attribute on can.route
         * @param  {can.Map} route Matching route
         * @param  {Object} change Change event details
         * @param  {String} newVal New value
         * @param  {String} oldVal Old value
         */
        "{can.route} room": function(route, change, newVal, oldVal) {
            var targetCoords = this.gridInternals.gridLookup["#" + newVal];

            // Check if the room is on the grid
            if(targetCoords) {

                // Send the request to move our location in the grid
                this._move(this.state.attr("currentCoordinates"), targetCoords);
            }
            else console.log("off the grid");
        },

        /**
         * Event handler for when a link within the grid is clicked
         * @param  {HTMLElement} el   Target element
         * @param  {jQuery.Event} ev  Click event
         */
        "{arrowKeysTargetEl} a click": function(el, ev) {
            var target = can.route.deparam(el[0].hash.substring(1)),
                targetCoords = this.gridInternals.gridLookup["#" + target.room];

            // Check if the room is on the grid
            if(targetCoords) {

                // Prevent default behavior
                ev.preventDefault();
                ev.stopPropagation();

                // Update the room attribute on the route so the move can be attempted
                can.route.attr("room", target.room);
            }
            else console.log("off the grid...");
        }
    });
});