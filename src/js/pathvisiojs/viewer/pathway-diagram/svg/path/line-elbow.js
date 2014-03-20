pathvisiojs.view.pathwayDiagram.svg.path.lineElbow = function(){
  'use strict';

  //for generating line segments through a path of points (pathpoints, not waypoints)
  var svgLine = d3.svg.line()
  .x(function(d) {return d.x;})
  .y(function(d) {return d.y;})
  .interpolate("step-after");
  //.interpolate("linear");

  function getAttributes(data) {
    var pathData = svgLine(data.points);

    var attributes = [
      {
        name:'d',
        path: pathData
      }
    ];
    return attributes;
  }

  return {
    getAttributes:getAttributes
  };
}();