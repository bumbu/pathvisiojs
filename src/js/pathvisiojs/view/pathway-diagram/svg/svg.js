pathvisiojs.view.pathwayDiagram.svg = function(){

  var svg, shapesAvailable, markersAvailable, contextLevelInput;

  function setCTM(element, matrix) {
    var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
    element.setAttribute("transform", s);
  }

  function load(args, callback) {
    if (!args.svg) {
      throw new Error("Missing svg.");
    }
    if (!args.pathway) {
      throw new Error("Missing pathway.");
    }
    var svg = args.svg;
    async.series([
      function(callback){
        // TODO get SVG from where it was already defined
        svg = d3.select('body').select('#pathway-svg')
        //draw(svg, pathway, function() {
        pathvisiojs.view.pathwayDiagram.svg.quickRender(args, function() {
          callback(null);
        })
      },
      function(callback) {
        var svgDimensions = pathvisiojs.view.pathwayDiagram.fitElementWithinContainer(args.target, args.pathway.image.width, args.pathway.image.height, args.preserveAspectRatio);
        d3.select('#loading-icon').remove();

        var initialClickHappened = false;
        svg.attr('style', 'display: inline; width: ' + args.target.width + 'px; height: ' + args.target.height + 'px; ')
        .on("click", function(d, i){
          svgPanZoom.enableZoom();
          initialClickHappened = true;
        })
        .on("mouseover", function(d, i){
          if (initialClickHappened) {
            svgPanZoom.enableZoom();
          }
        })
        .on("mouseout", function(d, i){
          if (initialClickHappened) {
            svgPanZoom.disableZoom();
          }
        });

        // TODO avoid defining svg again

        var svgElement = document.querySelector('svg');
        var m1 = svgElement.getCTM();
        var p = {'x': m1.e, 'y': m1.f};
        var m2 = svgElement.createSVGMatrix().translate(p.x, p.y).scale(svgDimensions.scale).translate(-p.x, -p.y);
        var viewport = svgElement.querySelector('#viewport');
        setCTM(viewport, m2);

        /*
         * function setCTM(element, matrix) {
         var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
         console.log(s);

         element.setAttribute("transform", s);
         }
         var svgElement = document.querySelector('svg');
         var m1 = svgElement.getCTM();
         var xScale1 = m1.a;
         var yScale1 = m1.d;
         var zoomFactor = 0.2;
         var p = {'x': m1.e, 'y': m1.f};
         var z = xScale1 * (1+zoomFactor);
         var m2 = svgElement.createSVGMatrix().translate(p.x, p.y).scale(z).translate(-p.x, -p.y);
         var viewport = svgElement.querySelector('#viewport');
         setCTM(viewport, m2);
        //*/

        svgPanZoom.init({
          'root': 'svg',
          'zoomEnabled': false 
        });
        callback(null);
      }
    ],
    function(err, results) {
      callback();
    });
  }

  function loadPartials(args, callbackOutside) {
    var pathvisioJsContainer, pathwayContainer, allSymbolNames;
    async.series([
      function(callback) {
        args.target.element.html(pathvisioNS['tmp/pathvisio-js.html']);
        pathvisioJsContainer = args.target.element.select('#pathvisio-js-container');
        pathwayContainer = pathvisioJsContainer.select('#pathway-container')
        .attr('class', args.preserveAspectRatioValues.yAlign);

        svg = pathvisioJsContainer.select('#pathway-svg')
        .attr('class', args.preserveAspectRatioValues.xAlign)
        //.attr('viewBox', '0 0 ' + args.target.width + ' ' + args.target.height)
        .attr('style', 'display: none; ');

        callback(null);
      },
      function(callback) {
        if (!!args.customMarkers) {
          pathvisiojs.view.pathwayDiagram.svg.edge.marker.loadAllCustom(svg, args.customMarkers, function() {
            callback(null);
          })
        }
        else {
          callback(null);
        }
      },
      function(callback) {
        if (!!args.customShapes) {
          pathvisiojs.view.pathwayDiagram.svg.symbol.loadAllCustom(svg, args.customShapes, function() {
            callback(null);
          })
        }
        else {
          callback(null);
        }
      },
      function(callback) {
        pathvisiojs.view.pathwayDiagram.svg.symbol.getAllSymbolNames(svg, function(data) {
          allSymbolNames = data;
          callback(null);
        });
      },
      function(callback) {
        if (!!args.cssUrl) {
          d3.text(args.cssUrl, 'text/css', function(data) {
            var defs = svg.select('defs');
            var style = defs.append('style').attr('type', "text/css");
            style.text(data);
            callback(null);
          })
        }
        else {
          callback(null);
        }
      }
    ],
    function(err, results) {
      callbackOutside(svg, allSymbolNames);
    });
  }

  function quickRenderMultipleElements(args, callbackOutside){
    if (!args.target) {
      throw new Error("No target specified.");
    }
    if (!args.data) {
      throw new Error("No data entered to render.");
    }
    if (!args.allSymbolNames) {
      throw new Error("No allSymbolNames (list of symbols in this diagram) specified.");
    }
    if (!args.pathway) {
      console.log("Optional input 'pathway' not specified.");
    } 

    var contextLevelInput = pathvisiojs.utilities.clone(pathvisiojs.context);
    contextLevelInput.dependsOn = "ex:dependsOn";

    // TODO this is a hack. Should define args the same way each time. Should args include pathway or just organism?
    var organism;
    if (args.hasOwnProperty('pathway')) {
      organism = args.pathway.organism;
    }
    else {
      organism = args.organism;
    }

    async.waterfall([
      function(callback) {
        args.data.sort(function(a, b) {
          return a.zIndex - b.zIndex;
        });
        callback(null, args.data);
      },
      function(data, callback) {
        data.forEach(function(element) {
          if (element.renderableType === 'Group') {
            args.data = element;
            pathvisiojs.view.pathwayDiagram.svg.node.render(args, function(groupContainer) {
              groupContainer.attr("class", function (d) {
                return 'group group-' + strcase.paramCase(d.ShapeType);
              })

              var groupedElementsFrame = {
                '@context': pathvisiojs.context,
                "@type":element.GroupId
              };
              jsonld.frame(args.pathway, groupedElementsFrame, function(err, groupedElementsData) {
                var nodeEntityArgs = {};
                nodeEntityArgs.target = groupContainer;
                nodeEntityArgs.data = groupedElementsData['@graph'];
                nodeEntityArgs.allSymbolNames = args.allSymbolNames;
                nodeEntityArgs.organism = organism;
                pathvisiojs.view.pathwayDiagram.svg.quickRenderMultipleElements(nodeEntityArgs, function() {
                });
              });
            });
          }
          else {
            if (element.renderableType === 'entityNode') {
              args.data = element;
              args.organism = organism;
              pathvisiojs.view.pathwayDiagram.svg.node.entityNode.render(args);
            }
            else {
              if (element.renderableType === 'edge') {
                pathvisiojs.view.pathwayDiagram.svg.edge.render(args.target, element);
              }
            }
          }
        });
        callback(null, 'Successfully rendered elements');
      }
    ],
    function(err, results) {
      callbackOutside(null);
    })
  }

  function quickRender(args, callback){
    if (!args.svg) {
      throw new Error("No svg specified.");
    }
    if (!args.pathway) {
      throw new Error("No data entered to render.");
    }
    if (!args.allSymbolNames) {
      throw new Error("No allSymbolNames (list of symbols in this diagram) specified.");
    }

    async.parallel({
      /*
      'hierarchicalData': function(callbackInside) {
        self.pathway = args.pathway;
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'element'
        };  
        jsonld.frame(args.pathway, frame, function(err, hierarchicalData) {
          callbackInside(null, hierarchicalData);
        });
      },
      'notGroupedData': function(callbackInside) {
        var notGroupedFrame = {
          '@context': pathvisiojs.context,
          "@type":"notGrouped"
        };
        jsonld.frame(args.pathway, notGroupedFrame, function(err, notGroupedData) {
          callbackInside(null, notGroupedData['@graph']);
        });
      },
      'groupData': function(callbackInside) {
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'Group'
        };  
        jsonld.frame(args.pathway, frame, function(err, groupData) {
          callbackInside(null, groupData['@graph']);
        });
      },
      //*/
      'grid': function(callbackInside) {
        pathvisioNS.grid = {};
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'entityNode'
        };  
        jsonld.frame(args.pathway, frame, function(err, framedData) {
          pathvisiojs.view.pathwayDiagram.pathFinder.generateGridData(framedData['@graph'], args.pathway.image.width, args.pathway.image.height, function() {
            callbackInside(null);
          });
        });
      },
      'firstOrderData': function(callbackInside) {
        var firstOrderFrame = {
          '@context': pathvisiojs.context,
          "@type":["notGrouped", "Group"]
        };
        jsonld.frame(args.pathway, firstOrderFrame, function(err, firstOrderData) {
          callbackInside(null, firstOrderData['@graph']);
        });
      }
    },
    function(err, results) {
      args.target = args.svg.select('#viewport');
      args.data = results.firstOrderData;
      quickRenderMultipleElements(args, function() {
        callback(svg);
      });
      /*
      async.series([
        function(callbackInside2) {
          args.target = args.svg.select('#viewport');
          args.data = results.groupData;
          quickRenderMultipleElements(args, function() {
            console.log(1);
          });
          callbackInside2(null, svg);
        },
        function(callbackInside2) {
          args.target = args.svg.select('#viewport');
          args.data = results.notGroupedData;
          self.args = args;
          quickRenderMultipleElements(args, function() {
            console.log(2);
            callbackInside2(null, svg);
          });
        }
      ],
      function(err, results) {
        callback(svg);
      })
      //*/
    })
  }

  function render(args, callback){
    if (!args.svg) {
      throw new Error("No svg specified.");
    }
    if (!args.pathway) {
      throw new Error("No data entered to render.");
    }
    if (!args.allSymbolNames) {
      throw new Error("No allSymbolNames (list of symbols in this diagram) specified.");
    }

    async.parallel({
      'hierarchicalData': function(callbackInside) {
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'element'
        };  
        jsonld.frame(args.pathway, frame, function(err, hierarchicalData) {
          callbackInside(null, hierarchicalData);
        });
      },
      'groupData': function(callbackInside) {
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'a351d'
        };  
        jsonld.frame(args.pathway, frame, function(err, groupData) {
          callbackInside(null, groupData);
        });
      },
      'grid': function(callbackInside) {
        pathvisioNS.grid = {};
        var frame = {
          '@context': pathvisiojs.context,
          '@type': 'entityNode'
        };  
        jsonld.frame(args.pathway, frame, function(err, framedData) {
          pathvisiojs.view.pathwayDiagram.pathFinder.generateGridData(framedData['@graph'], args.pathway.image.width, args.pathway.image.height, function() {
            callbackInside(null);
          });
        });
      },
      'topLevelData': function(callbackInside) {
        var inputTopLevel = pathvisiojs.utilities.clone(args.pathway);
        inputTopLevel['@context'] = contextLevelInput;
        var topLevelFrame = {
          "@context": contextLevelInput,
          "@type":"element",
          "dependsOn": {}        
        };
        jsonld.frame(inputTopLevel, topLevelFrame, function(err, framedDataTopLevel) {
          var topLevelData = [];
          framedDataTopLevel['@graph'].forEach(function(element) {
            if (!element.dependsOn) {
              topLevelData.push(element['@id']);
            }
          });
          callbackInside(null, topLevelData);
        });
      }
    },
    function(err, results) {
      var resultsData = results.hierarchicalData['@graph'].filter(function(element) {
        return (results.topLevelData.indexOf(element['@id']) > -1);
      });
    })
  }

  function renderHierarchySiblings(args, callback){
    if (!args.svg) {
      throw new Error("No svg specified.");
    }
    if (!args.pathway) {
      throw new Error("No data entered to render.");
    }
    if (!args.allSymbolNames) {
      throw new Error("No allSymbolNames (list of symbols in this diagram) specified.");
    }

    var drag = d3.behavior.drag()
    .on("drag", dragmove);

    function dragmove(d) {
      d.x=d3.event.x;
      d.y=d3.event.y;
      d3.select(this)
      .attr("x", d3.event.x)
      .attr("y", d3.event.y);
    }


    //***********************
    // Viewport Element
    //***********************

    // TODO refactor so that svg isn't redefined here
    // Update…
    var viewport = svg.select('#viewport')
    .data([args.pathway]);

    //.attr('transform', function(d) {return 'translate(' + d.x + ' ' + d.y + ')';})
    /*
    .on("click", function(d,i) {
      if (d.elementType === 'data-node') {
        pathvisiojs.view.pathwayDiagram.svg.xRef.render(pathway.organism, d);
      }
    });
    */

    // Enter…
    /*
    viewport.enter().append("g")
    .attr("id", function (d) { return 'node-' + d.id; })
    .attr("id", 'viewport');
    //*/

    // Exit…
    viewport.exit().remove();


          /*
          "@vocab": "http://vocabularies.wikipathways.org/gpml#",
          "gpml": "http://vocabularies.wikipathways.org/gpml#",
          "shapeLibrary": "http://shapelibrary.example.org/",
          "shapeName": "shapeLibrary:shapeName",
          "ex": "http://example.org/vocab#"
          //*/






    /***********************
    // Use Elements
    //***********************/

    async.series([
      function(callbackInside){
        var frame = {
          "@context": pathvisiojs.context,
          "@type": args.allSymbolNames
        };  
        jsonld.frame(args.pathway, frame, function(err, framedData) {
          callbackInside(err, framedData);
        });
      }
    ],
    function(err, results) {
        // Update… 
        var useElementsContainers = viewport.selectAll('g.shape')
        .data(results[0]['@graph'])
        .call(function(selection) {
          pathvisiojs.view.pathwayDiagram.svg.node.render(selection, args.pathway.organism)
        });

        // Enter…
        useElementsContainers.enter().append("g")
        .call(function(selection) {
          pathvisiojs.view.pathwayDiagram.svg.node.render(selection, args.pathway.organism)
        });

        // Exit…
        useElementsContainers.exit().remove();

        // Update… 
        var useElements = useElementsContainers.selectAll("use.shape")
        .data(function(d) {
          return [d];
        })
        .call(pathvisiojs.view.pathwayDiagram.svg.node.useElement.render);

        // Enter…
        useElements.enter().append("use")
        .call(pathvisiojs.view.pathwayDiagram.svg.node.useElement.render);

        // Exit…
        useElements.exit().remove();
    });


    //pathvisiojs.view.pathwayDiagram.svg.node.pathShape.renderAll(viewport, pathShapes);

    /***********************
    // Path (Edge) Elements
    //***********************/

    async.series([
      function(callbackInside){
        var frame = {
          "@context": pathvisiojs.context,
          "@type": "SvgPath"
        };  
        jsonld.frame(args.pathway, frame, function(err, framedData) {
          callbackInside(err, framedData);
          //callback(err, framedData); // should I use this one instead?
        });
      }
    ],
    function(err, results) {
        // Update… 
        var edges = viewport.selectAll('path.edge')
        .data(results[0]['@graph'])
        .call(pathvisiojs.view.pathwayDiagram.svg.edge.render);

        // Enter…
        edges.enter().append("path")
        .call(pathvisiojs.view.pathwayDiagram.svg.edge.render);

        // Exit…
        edges.exit().remove();
    });


    //svg.attr('width', pathway.image.width);
    //svg.attr('height', pathway.image.height);

    /*
    if (!!pathway.biopaxRefs) {
      var pathwayPublicationXrefs = svg.select('#viewport').selectAll(".pathway-publication-xref-text")
      .data(pathway.biopaxRefs)
      .enter()
      .append("text")
      .attr("id", function (d) { return 'pathway-publication-xref-text-' + d; })
      .attr("x", 0)
      .attr("y", 0)
      .attr('transform', function(d,i) { return 'translate(' + (200 + i*12) + ' ' + 12 + ')'; })
      .attr("class", 'pathway-publication-xref-text')
      .attr("style", "")
      .text(function (d) {

        // d is an array of biopaxRefs. There are several IDs for biopaxRefs, but rdfId (rdf:id) is the one used for
        // GPML to link pathway elements with biopaxRefs.
        // TODO I set rdfId to null here because I think not doing so could result in errors if the rdfId value for
        // a previous instance of biopaxRefs had a value that was used when evaluating a later instance

        var index = 0;
        var rdfId = null;
        do {
          rdfId = pathway.biopax.bpPublicationXrefs[index].rdfId;
          index += 1;
        } while (rdfId !== d.Text && index < pathway.biopax.bpPublicationXrefs.length);
        return index;});
    }

    if (pathway.hasOwnProperty('groups')) {
      pathvisiojs.view.pathwayDiagram.svg.node.group.renderAll(svg, pathway);
    }

    if (pathway.hasOwnProperty('edges')) {
      pathvisiojs.view.pathwayDiagram.svg.edge.renderAll(svg, pathway);
    }
    else {
    console.log('none');
    }



    if (pathway.hasOwnProperty('infoBox')) {
      pathvisiojs.view.pathwayDiagram.svg.infoBox.render(svg, pathway);
    }

    //pathvisiojs.view.pathwayDiagram.svg.grid.render(svg);

    //pathvisiojs.view.pathwayDiagram.svg.anchor.renderAll(svg, pathway);

      window.svg = d3.select("svg")
      .attr('style', 'width: 500px');
//*/
    callback(svg);
  }

  return {
    render:render,
    quickRender:quickRender,
    quickRenderMultipleElements:quickRenderMultipleElements,
    load:load,
    loadPartials:loadPartials
  };
}();
