// import { getSvgScale } from "./util/utils.js";

(function(root){
  root.getSvgProps = getSvgProps;

  function getSvgProps(svg) {
    const svgViewbox = svg.getAttribute("viewBox").split(" ").map(Number);

    const scale = getSvgScale(svg);

    function getLength(_svg) {
      const paths = _svg.querySelectorAll("path, polygon");

      return [...paths].reduce((sum, item) => {
        sum += item.getTotalLength();
        return sum;
      }, 0) * scale;
    }

    function getArea(_svg) {
      const { ctx, canvas, canvasScale, destroy } = createCanvas(svgViewbox[2], svgViewbox[3]);
      const paths = _svg.querySelectorAll("path, polygon, polyline");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      [...paths].forEach((item, i) => {
        const poly = item.closest("polyline, polygon");
        let d = "";

        if (poly) {
          d = polyToPath(item.getAttribute("points"), poly.tagName);
        } else {
          d = item.getAttribute("d") 
        }

        ctx.scale(1 / canvasScale, 1 / canvasScale);
        ctx.fillStyle = "#000";
        const path = new Path2D(d);
        ctx.fill(path);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let check = {};
      let alphaValues = 0;

      alphaValues = imageData.filter((value, index) => index % 4 === (4 - 1) && value >= 125).length;
      for (let i = 0; i < imageData.length; i += 4) {
        let a = imageData[i + 3];
        if (check[a] === undefined) {
          check[a] = 0;
        }
        check[a]++;
      }

      destroy();

      return alphaValues * Math.pow(scale, 2) / Math.pow(1 / canvasScale, 2);
    }

    function polyToPath(string, polyType) {
      const points = string.split(/\s+|,/);
      let x0 = points.shift(), y0 = points.shift();
      let pathdata = `M${x0}, ${y0}L${points.join(' ')}`;
      if (polyType == "polygon") pathdata += "z";
      return pathdata;
    }

    function createCanvas(width, height) {
      const maxSize = 8000;
      let canvasScale = 1;

      if (width > height) {
        if (width > maxSize) {
          canvasScale = width / maxSize;
          height = height * (maxSize / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          canvasScale = height / maxSize;
          width = width * (maxSize / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      return {
        canvas,
        ctx: canvas.getContext("2d"),
        canvasScale,
        destroy() {
          canvas.remove();
        }
      };
    }

    return {
      length: () => {
        return getLength(svg);
      },
      area: () => {
        return getArea(svg);
      },
    }
  }
})(window);