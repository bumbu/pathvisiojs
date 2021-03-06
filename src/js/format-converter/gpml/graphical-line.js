'use strict';

var GpmlElement = require('./element.js')
  , Graphics = require('./graphics.js')
  , Point = require('./point.js')
  , Anchor = require('./anchor.js')
  ;

module.exports = {

  // TODO this isn't getting the linetype info for determining whether activity is direct or indirect yet
  gpmlArrowHeadToSemanticMappings: {
    'Arrow':'arrow'
  },

  toPvjson: function(pvjs, gpmlSelection, graphicalLineSelection, callback) {
    var jsonAnchorGraphicalLine,
      anchor,
      jsonAnchor,
      points,
      jsonPoints,
      graphicalLineType,
      target,
      targetId,
      groupRef,
      source,
      sourceId,
      pvjsonElements,
      pvjsonPath = {};

    pvjsonPath.networkType = 'edge';
    GpmlElement.toPvjson(pvjs, gpmlSelection, graphicalLineSelection, pvjsonPath, function(pvjsonPath) {
      Graphics.toPvjson(pvjs, gpmlSelection, graphicalLineSelection, pvjsonPath, function(pvjsonPath) {
        Point.toPvjson(pvjs, gpmlSelection, graphicalLineSelection, pvjsonPath, function(pvjsonPath) {
          Anchor.toPvjson(pvjs, gpmlSelection, graphicalLineSelection, pvjsonPath, function(pvjsonAnchor) {
            pvjsonElements = [pvjsonPath].concat(pvjsonAnchor);
            callback(pvjsonElements);
          });
        });
      });
    });
  }
}
