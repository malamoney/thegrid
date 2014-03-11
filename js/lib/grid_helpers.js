define(['can/list'], function() {
    'use strict';

    var GridHelpers = {};

    /**
     * Convert an array of grid data to the grid format required by thegrid
     * @param  {Array} gridData         array of grid data
     * @param  {Number} gridSize        number of rows and columns in thegrid
     * @return {Array}                  formatted grid data
     */
    GridHelpers.makeGridInternals = function(gridData, gridSize) {
        var i, j,
            temp,
            gridArray = new can.List(),
            gridLookup = {};

        //gridData = gridData.serialize();

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
    GridHelpers.whichTransitionEvent = function() {
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

    return GridHelpers;
});