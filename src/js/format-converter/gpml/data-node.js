'use strict';

var GpmlElement = require('./element.js')
  , Graphics = require('./graphics.js')
  ;

module.exports = {
  toPvjson: function(pvjs, pathway, gpmlSelection, dataNodeSelection, callbackInside) {
    var pvjsonPath = {};
    var dataNodeType = dataNodeSelection.attr('Type');
    if (!dataNodeType) {
      dataNodeType = 'Unknown';
    }
    pvjsonPath.networkType = 'node';
    pvjsonPath.nodeType = 'DataNode';
    pvjsonPath.dataNodeType = dataNodeType;
    pvjsonPath['@type'] = pvjsonPath['@type'] || [];
    pvjsonPath['@type'].push('DataNode');
    pvjsonPath['@type'].push(dataNodeType);



    GpmlElement.toPvjson(pvjs, gpmlSelection, dataNodeSelection, pvjsonPath, function(pvjsonPath) {
      Graphics.toPvjson(pvjs, gpmlSelection, dataNodeSelection, pvjsonPath, function(pvjsonPath) {
        var database, id, datasourceReference,
          datasourceReferenceSelection = dataNodeSelection.select('Xref');
        if (!!datasourceReferenceSelection) {
          database = datasourceReferenceSelection.attr('Database');
          id = datasourceReferenceSelection.attr('ID');
          if (!!database && !!id) {
            datasourceReference = {};
            datasourceReference.database = database;
            datasourceReference.id = id;
            datasourceReference.organism = gpmlSelection.attr('Organism');
            pvjsonPath.datasourceReference = datasourceReference;
          }
        }

        var pvjsonElements = [pvjsonPath];
        callbackInside(pvjsonElements);
      });
    });
  }
}
