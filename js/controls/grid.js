define([
    'can/control',
    'can/map',
    'mustache!../../views/thegrid'
], function(Control, Map, gridStache) {
    'use strict';

    /**
     * Convert an array of grid data to the grid format required by thegrid
     * @param  {Array} gridData         array of grid data
     * @param  {Number} gridSize        number of rows and columns in thegrid
     * @return {Array}                  formatted grid data
     */
    var _makeGridArray = function(gridData, gridSize) {
        var i, j,
            temp,
            gridArray = [];

        // Is gridData an array of arrays?
        if(can.isArray(gridData[0])) {
            for(i=0; i<gridSize; i++) {
                gridArray.push([]);
                for(j=0; j<gridSize; j++) {
                    gridArray[i].push(gridData[i] ? new can.Map({
                        gid: gridData[i][j]
                    }) : undefined);
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
                }
            }
        }

        return gridArray;
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
            diagonal: 0
        }
    },{
        init: function() {
            var self = this,
                el = this.element[0],
                gridData = _makeGridArray(this.options.roomList, this.options.gridSize),
                fragment,
                room;

            this.gridData = gridData;

            // Create the state
            this.state = new can.Map({
                ready: 1,
                currentRoom: this.options.startingRoom,
                currentCoordinates: this._getCoordinates(this.options.startingRoom),
                currentClass: can.compute(function() {
                    return "room-" + self.state.attr("currentRoom");
                })
            });

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
                            room.className = room.className.replace(/\bgrid-room-hidden\b/,'');
                            room.className += " grid-room room-"+(i*this.options.gridSize+j);
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

            this.options.gridEl = this.thegrid;
            this.options.transitionEndEvent = _whichTransitionEvent();
            this.on();
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
         * Move current location on grid
         * @param  {String} direction Direction to move
         * @return {Boolean}          Whether move was successfull
         */
        _move: function(direction) {
            var thegrid = this.thegrid,
                currentCoordinates = this.state.attr("currentCoordinates"),
                moveToCoords = this._getMoveToCoordinates(this.state.attr("currentCoordinates"), direction),
                moveToRoom = this._getRoomFromCoordinates(moveToCoords);

            // Check if we are allowed to move from the current location to the request location
            if(this._isMoveAllowed(currentCoordinates, moveToRoom)) {
                thegrid.removeClass(thegrid.data("room")).addClass("room-" + moveToRoom).data("room", "room-" + moveToRoom);
                this.state.attr("currentRoom", moveToRoom);
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
         * @param  {Object} room Room coordinates
         * @return {Array}       List of allowed rooms you can move to
         */
        _getAllowedMoves: function(room) {
            var legalMoves = [],
                gridSize = this.options.gridSize,
                wrapping = this.options.wrapping;

            if(room.x > 0 || (room.x === 0 && wrapping)) {
                legalMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(room, "left")));
            }
            if(room.x < (gridSize-1) || (room.x === (gridSize-1) && wrapping)) {
                legalMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(room, "right")));
            }
            if(room.y > 0 || (room.y === 0 && wrapping)) {
                legalMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(room, "up")));
            }
            if(room.y < (gridSize-1) || (room.y === (gridSize-1) && wrapping)) {
                legalMoves.push(this._getRoomFromCoordinates(this._getMoveToCoordinates(room, "down")));
            }
            return legalMoves;
        },

        /**
         * Check if a specific move is allowed
         * @param  {Object}  from Coordinates of starting room
         * @param  {Number}  to   Room number of room we want to move to
         * @return {Boolean}      Whether move is allowed
         */
        _isMoveAllowed: function(from, to) {
            var legalMoves = this._getAllowedMoves(from);
            return ~(can.inArray(to, legalMoves));
        },

        /**
         * Bind to the keydown event so we can listen for the arrow keys
         * @param  {HTMLElement} el     The element the keydown event was triggered on
         * @param  {jQuery.Event} ev    keydown event
         */
        "{arrowKeysTargetEl} keydown": function(el, ev) {

            var charCode = (ev.which) ? ev.which : event.keyCode,
                thegrid = this.thegrid,
                gridSize = this.options.gridSize,
                currentRoom,
                row;

            // Check if the key pressed was an arrow key
            if(charCode >= 37 && charCode <= 40) {

                // Check if we are currently in motion and if so, prevent until motion is complete
                if(!this.state.attr("ready")) return;
                this.state.attr("ready", 0);

                currentRoom = this.state.attr("currentRoom");
                row = ~~(currentRoom/gridSize);
                console.log("currentRoom: " + currentRoom + "(" + row + ")");

                if(charCode === 37) {
                    this._move("left");
                }
                else if(charCode === 38) {
                    this._move("up");
                }
                else if(charCode === 39) {
                    this._move("right");
                }
                else if(charCode === 40) {
                    this._move("down");
                }
            }
        }
    });
});