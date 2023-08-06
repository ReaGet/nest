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
      const { imageData, canvasScale } = getCanvasData(_svg);
      let check = {};
      let alphaValues = 0;

      // alphaValues = imageData.filter((value, index) => index % 4 === (4 - 1) && value >= 125).length;
      // for (let i = 0; i < imageData.length; i += 4) {
      //   let a = imageData[i + 3];
      //   if (check[a] === undefined) {
      //     check[a] = 0;
      //   }
      //   check[a]++;
      // }
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] < 50 && imageData[i + 1] === 0 && imageData[i + 2] === 0) {
          alphaValues++;
        }
      }

      return alphaValues * Math.pow(scale, 2) / Math.pow(1 / canvasScale, 2);
    }

    function calcOuterRect(_svg) {
      const { imageData, canvasScale, canvas } = getCanvasData(_svg);
      const bounds = {
        xMin: Number.MAX_SAFE_INTEGER,
        xMax: Number.MIN_SAFE_INTEGER,
        yMin: Number.MAX_SAFE_INTEGER,
        yMax: Number.MIN_SAFE_INTEGER,
      };

      for (let i = 0; i < imageData.length; i += 4) {
        const x = (i / 4) % canvas.width,
          y = ~~(i / canvas.width);
        if (imageData[i] < 50 && imageData[i + 1] === 0 && imageData[i + 2] === 0) {
          bounds.xMin = Math.min(bounds.xMin, x);
          bounds.xMax = Math.max(bounds.xMax, x);
          bounds.yMin = Math.min(bounds.yMin, y);
          bounds.yMax = Math.max(bounds.yMax, y);
        }
      }
      // console.log(bounds)
      const width = bounds.xMax - bounds.xMin,
        height = bounds.yMax - bounds.yMin;
      return (width * height) * Math.pow(scale, 2) / Math.pow(1 / canvasScale, 2) / 4;
    }
    
    function getCanvasData(_svg) {
      // console.log(_svg, svgViewbox)
      const { ctx, canvas, canvasScale, destroy } = createCanvas(svgViewbox[2], svgViewbox[3]);
      const paths = _svg.querySelectorAll("path, polygon, polyline");
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#f00";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // console.log(canvas.width, canvas.height);

      [...paths].forEach((item, i) => {
        const poly = item.closest("polyline, polygon");
        let d = "";

        if (poly) {
          d = polyToPath(item.getAttribute("points"), poly.tagName);
        } else {
          d = item.getAttribute("d");
        }
        const { translate, rotate } = getGProps(item);
        const xOffset = (translate.x -svgViewbox[0]),
          yOffset = (translate.y - svgViewbox[1]);

        // console.log(item, translate.x, Math.abs(svgViewbox[0]), translate.x + Math.abs(svgViewbox[0]), xOffset);
        // console.log(d, xOffset, yOffset)

        ctx.setTransform(1 / canvasScale, 0, 0, 1 / canvasScale, xOffset, yOffset);
        // ctx.setTransform(1 / canvasScale, 0, 0, 1 / canvasScale, translate.x, translate.y);
        ctx.rotate(rotate * Math.PI / 180);

        ctx.fillStyle = "#000";
        const path = new Path2D(d);
        ctx.beginPath();
        ctx.fill(path);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      destroy();

      return { imageData, canvasScale, canvas };
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
      
      // canvas.width = 10000;
      // canvas.height = 10000;
      // document.body.appendChild(canvas);

      return {
        canvas,
        ctx: canvas.getContext("2d"),
        canvasScale,
        destroy() {
          canvas.remove();
        }
      };
    }
    
    function polyToPath(string, polyType) {
      const points = string.split(/\s+|,/);
      let x0 = points.shift(), y0 = points.shift();
      let pathdata = `M${x0}, ${y0}L${points.join(" ")}`;
      if (polyType == "polygon") pathdata += "z";
      return pathdata;
    }

    function getGProps(el) {
      const values = {
        translate: { x: 0, y: 0 },
        rotate: 0,
      };
      const parent = el.closest("g");
      if (parent) {
        const translate = parent.getAttribute("transform").match(/translate\((-?\d+\.?\d*),?\s*(-?\d+[.]?\d*)?\)/);
        const rotate = parent.getAttribute("transform").match(/rotate\((-?\d+\.?\d*),?\s*(-?\d+[.]?\d*)?\)/);
        values.translate.x = +translate[1];
        values.translate.y = +translate[2];
        values.rotate = +rotate[1];
      }

      return values;
    }

    return {
      length: () => {
        return getLength(svg);
      },
      area: () => {
        return getArea(svg);
      },
      outerRect: () => {
        return calcOuterRect(svg);
      },
    }
  }
})(window);