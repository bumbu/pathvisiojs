(function(window){

  var optionsDefault = {}

  /**
   * Init plugin
   *
   * @param {pathvisiojs instance} pvjs
   */
  function PathvisiojsDiffviewer(pvjs, options) {
    var options = options || {}

    // Copy default options
    for (var i in optionsDefault) {
      if (optionsDefault.hasOwnProperty(i) && !options.hasOwnProperty(i)) {
        options[i] = optionsDefault[i]
      }
    }

  }

  /**
   * Expose plugin globally
   */
  window.pathvisiojsDiffviewer = PathvisiojsDiffviewer
})(window)
