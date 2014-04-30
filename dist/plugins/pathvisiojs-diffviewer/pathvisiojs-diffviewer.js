(function(window){

  var optionsDefault = {
    sourceData: []
  }

  /**
   * Init plugin
   *
   * @param {pathvisiojs instance} pvjs
   */
  function PathvisiojsDiffviewer(pvjs, options) {
    var options = options || {}
      , diffviewer = document.createElement('div')
      , $diffviewer = d3.select(diffviewer)

    // Copy default options
    for (var i in optionsDefault) {
      if (optionsDefault.hasOwnProperty(i) && !options.hasOwnProperty(i)) {
        options[i] = optionsDefault[i]
      }
    }

    // Add diffviewer container before pvjs element
    pvjs.$element[0][0].parentNode.insertBefore(diffviewer, pvjs.$element[0][0])

    // Set diffviewer class
    $diffviewer.attr('class', 'pathvisiojs-diffviewer')

    // Create panes
    $diffviewer.html('<div class="pane pane-left"></div><div class="pane pane-right"/></div>')

    var $paneLeft = $diffviewer.select('.pane-left')
      , $paneRight = $diffviewer.select('.pane-right')

    // Move instance element into left pane
    $paneLeft[0][0].appendChild(pvjs.$element[0][0])

    // Create second instance container
    var $pvjs2Element = $paneRight.append('div')

    // pvjs options
    var pvjsOptions = pvjs.getOptions()
    pvjsOptions.sourceData = options.sourceData
    pvjsOptions.manualRender = options.false

    // Create second pvjs instance
    var pvjs2 = window.pathvisiojs($pvjs2Element[0][0], pvjsOptions)[0]
  }

  /**
   * Expose plugin globally
   */
  window.pathvisiojsDiffviewer = PathvisiojsDiffviewer
})(window)
