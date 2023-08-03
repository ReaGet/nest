(function(root) {
  root.getSvgScale = getSvgScale;
  root.getNumber = getNumber;

  function getSvgScale(svg) {
    const svgWidth = getNumber(svg.getAttribute("width"));
    const svgViewbox = svg.getAttribute("viewBox").split(" ").map(Number);
  
    return svgWidth / svgViewbox[2];
  }
  
  function getNumber(str) {
    return parseFloat(str.match(/[+-]?\d+(\.\d+)?/g));
  }
})(window);