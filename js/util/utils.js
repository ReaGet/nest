(function(root) {
  root.getSvgScale = getSvgScale;
  root.getNumber = getNumber;
  root.getCorrectSvgProps = getCorrectSvgProps;

  function getSvgScale(svg) {
    const svgWidth = getNumber(svg.getAttribute("width"));
    const svgViewbox = svg.getAttribute("viewBox").split(" ").map(Number);
  
    return svgWidth / svgViewbox[2];
  }
  
  function getNumber(str) {
    return parseFloat(str.match(/[+-]?\d+(\.\d+)?/g));
  }

  function getCorrectSvgProps(svg) {
    const items = svg.querySelectorAll("path, polygon, polyline");
    const result = {
      svg: {
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
      },
      viewbox: svg.getAttribute("viewBox"),
    };
    let scale = 1;
    const svgWidth = svg.getAttribute("width").match(/(\d+\.\d+|\d+)([a-zA-Z]+)?/).slice(1).filter(Boolean);
    const svgHeight = svg.getAttribute("height").match(/(\d+\.\d+|\d+)([a-zA-Z]+)?/).slice(1).filter(Boolean);
    const svgViewbox = svg.getAttribute("viewBox").split(" ").filter(Boolean).map(Number);

    // console.log(svg, svgWidth, svgHeight, svgViewbox)

    const bounds = {
      xMin: Number.MAX_SAFE_INTEGER,
      xMax: Number.MIN_SAFE_INTEGER,
      yMin: Number.MAX_SAFE_INTEGER,
      yMax: Number.MIN_SAFE_INTEGER,
    };

    items.forEach((item) => {
      const boundingRect = item.getBBox();

      bounds.xMin = Math.min(bounds.xMin, boundingRect.x);
      bounds.xMax = Math.max(bounds.xMax, boundingRect.x + boundingRect.width);
      bounds.yMin = Math.min(bounds.yMin, boundingRect.y);
      bounds.yMax = Math.max(bounds.yMax, boundingRect.y + boundingRect.height);
    });

    const newViewboxWidth = bounds.xMax - bounds.xMin;
    scale = newViewboxWidth / svgViewbox[2];

    result.svg.width = `${+svgWidth[0] * scale}${svgWidth[1] || ""}`;
    result.svg.height = `${+svgHeight[0] * scale}${svgHeight[1] || ""}`;
    result.viewbox = `${bounds.xMin} ${bounds.yMin} ${bounds.xMax - bounds.xMin} ${bounds.yMax - bounds.yMin}`;

    // return {
    //   x: bounds.xMin,
    //   y: bounds.yMin,
    //   width: bounds.xMax - bounds.xMin,
    //   height: bounds.yMax - bounds.yMin,
    // };

    // return `${bounds.xMin} ${bounds.yMin} ${bounds.xMax - bounds.xMin} ${bounds.yMax - bounds.yMin}`;
    return result;
  }
})(window);