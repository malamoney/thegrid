define([
    'can/control'
], function(Control) {
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
                    gridArray[i].push(gridData[i] ? gridData[i][j] : undefined);
                }
            }
        }
        else {
            for(i=0; i<gridSize; i++) {
                gridArray.push([]);
                for(j=0; j<gridSize; j++) {
                    gridArray[i].push(gridData[j+(gridSize*i)]);
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
            startingRoom: "room-1"
        }
    },{
        init: function() {
            var self = this,
                el = this.element[0],
                gridData = _makeGridArray(this.options.roomList, this.options.gridSize),
                fragment,
                gridEl,
                containerEl,
                room;

            // Create the state
            this.state = new can.Map({
                ready: 1
            });

            // Create a fragment to contain the grid DOM
            fragment = document.createDocumentFragment();
            gridEl = document.createElement("div");
            gridEl.className = "thegrid";

            // Move all the potential rooms to the new grid element
            while(el.childNodes.length > 0) {

                // Add a class to hide all potential rooms
                el.childNodes[0].className += " grid-room-hidden";
                gridEl.appendChild(el.childNodes[0]);
            }

            // Create the grid container
            containerEl = document.createElement("section");
            containerEl.className = "grid-container";

            // Wrap the grid in a grid-container
            containerEl.appendChild(gridEl);

            // Set the starting room
            gridEl.className += " " + this.options.startingRoom;
            gridEl.setAttribute("data-room", this.options.startingRoom);

            // Append the grid container to the document fragment
            fragment.appendChild(containerEl);

            // Attach grid-room classes to each grid element (room)
            for(var i=0; i<gridData.length; i++) {
                for(var j=0; j<gridData[i].length; j++) {

                    room = fragment.querySelector("#"+gridData[i][j]);
                    if(room) {
                        room.className = room.className.replace(/\bgrid-room-hidden\b/,'');
                        room.className += " grid-room room-"+(i*this.options.gridSize+j);
                    }
                    else {}
                }
            }

            el.appendChild(fragment.cloneNode(true));

            this.thegrid = document.getElementsByClassName("thegrid")[0];

            // On transistionEnd, re-enable grid movement
            this.thegrid.addEventListener(_whichTransitionEvent(), function() {
                self.state.attr("ready", 1);
                //console.log("transition ended...");
            }, false);
        },

        // Bind to the keydown event so we can listen for the arrow keys
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

                currentRoom = +thegrid.dataset.room.replace(/room-/, "");
                row = ~~(currentRoom/gridSize);
                console.log("currentRoom: " + currentRoom + "(" + row + ")");

                if(charCode === 37) {
                    if(currentRoom-1 >= row*gridSize) {
                        thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
                        thegrid.className += " room-" + (currentRoom-1);
                        thegrid.setAttribute("data-room", "room-" + (currentRoom-1));
                    }
                    else this.state.attr("ready", 1);
                }
                else if(charCode === 38) {
                    if(currentRoom-gridSize >= 0) {
                        thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
                        thegrid.className += " room-" + (currentRoom-gridSize);
                        thegrid.setAttribute("data-room", "room-" + (currentRoom-gridSize));
                    }
                    else this.state.attr("ready", 1);
                }
                else if(charCode === 39) {
                    if(currentRoom+1 < (row+1)*gridSize) {
                        thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
                        thegrid.className += " room-" + (currentRoom+1);
                        thegrid.setAttribute("data-room", "room-" + (currentRoom+1));
                    }
                    else this.state.attr("ready", 1);
                }
                else if(charCode === 40) {
                    if(currentRoom+gridSize < gridSize*gridSize) {
                        thegrid.className = thegrid.className.replace(new RegExp(thegrid.dataset.room), "");
                        thegrid.className += " room-" + (currentRoom+gridSize);
                        thegrid.setAttribute("data-room", "room-" + (currentRoom+gridSize));
                    }
                    else this.state.attr("ready", 1);
                }
            }
        }
    });
});