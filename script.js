const svgWrapper = document.querySelector(".preview");
const unitSelect = document.querySelector(".control__select");

const binSize = {
  width: 3020,
  height: 2020,
};

const items = {
  bg: null,
  svg: null,
};

const result = {
  area: document.querySelector(".info--area .result__info-value"),
  length: document.querySelector(".info--length .result__info-value"),
  outerRect: document.querySelector(".info--outerRect .result__info-value"),
};

const bins = document.getElementById("bins"); 

let scale = 1;
let isWorking = false;

document.querySelector("#fileDialog").addEventListener("change", (event) => {
  [...event.target.files].forEach((item) => {
    const url = window.URL.createObjectURL(item);
    fetch(url)
      .then((response) => response.text())
      .then((svg) => {
        const svgEl = SvgNest.parsesvg(svg);
        const option = unitSelect.options[unitSelect.selectedIndex];
        resetResults();
        appendSvg(svgEl);

        result.area.innerHTML = getArea(option);
        result.length.innerHTML = getLength(option);
        getOuterRect(option, (res) => {
          result.outerRect.innerHTML = res.map((value, index) => {
            return `<span>#${index+1}: ${convertToUnit(value, option, "outerRectResults")}</span>`;
          }).join("");
        })
      });
  });
});

function resetResults() {
  result.area.innerHTML = "0";
  result.length.innerHTML = "0";
  result.outerRect.innerHTML = "0";
  svgWrapper.innerHTML = "";
  bins.innerHTML = "";
}

function appendSvg(_svg) {
  svgWrapper.appendChild(_svg);

  const correctSvgProps = getCorrectSvgProps(_svg);
  // Original SVG
  _svg.setAttribute("width", correctSvgProps.svg.width);
  _svg.setAttribute("height", correctSvgProps.svg.height);
  _svg.setAttribute("viewBox", correctSvgProps.viewbox);
  scale = getSvgScale(_svg);
  // BG RECT
  const bgSvgRect = createBgSvgRect(_svg);
  _svg.classList.add("svg-original");
  console.log(binSize)
  svgWrapper.appendChild(bgSvgRect);
  bgSvgRect.setAttribute("width", binSize.width / scale);
  bgSvgRect.setAttribute("height", binSize.height / scale);

  items.bg = bgSvgRect.querySelector("rect");
  items.svg = _svg;
}

function getLength(option) {
  const svgProps = getSvgProps(items.svg);
  const value = svgProps.length();
  return convertToUnit(value, option, "length");
}

function getArea(option) {
  const svgProps = getSvgProps(items.svg);
  const value = svgProps.area();
  return convertToUnit(value, option, "area");
}

function getOuterRect(option, fn) {
  stopNesting();
  startNesting(fn);
}

document.addEventListener("click", ({ target }) => {
  const { action } = target.dataset;
  const svg = items.svg;
  const option = unitSelect.options[unitSelect.selectedIndex];

  if (action === "outerRectResults") {
    
  }

  if (action === "nest") {
    isWorking ? stopNesting() : startNesting();
  }
});

function convertToUnit(value, option, unitType) {
  switch (option.value) {
    case "mm":
      return `${value.toFixed(3)} ${option.innerHTML}`;
      break;
    case "m":
      if (unitType === "length") {
        return `${(value * Math.pow(10, -3)).toFixed(3)} ${option.innerHTML}`;
      }
      if (unitType === "area" || unitType === "outerRect" || unitType === "outerRectResults") {
        return `${(value * Math.pow(10, -6)).toFixed(3)} ${option.innerHTML}`;        
      }
      break;
  }
}

function createBgSvgRect(svg) {
  const wholeSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const viewBoxValue = `0 0 ${getNumber(svg.getAttribute('width'))} ${getNumber(svg.getAttribute('height'))}`
  wholeSVG.setAttribute('width', svg.getAttribute('width'));
  wholeSVG.setAttribute('height', svg.getAttribute('height'));
  wholeSVG.setAttribute('viewBox', viewBoxValue);
  wholeSVG.classList.add("svgFullrect");
  const rect = document.createElementNS(wholeSVG.namespaceURI,'rect');
  // rect.setAttribute('x', wholeSVG.viewBox.baseVal.x);
  // rect.setAttribute('y', wholeSVG.viewBox.baseVal.y);
  // rect.setAttribute('width', wholeSVG.viewBox.baseVal.width);
  // rect.setAttribute('height', wholeSVG.viewBox.baseVal.height);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', getNumber(svg.getAttribute('width')));
  rect.setAttribute('height',getNumber(svg.getAttribute('height')));
  rect.setAttribute('class', 'fullRect');
  wholeSVG.appendChild(rect);

  return wholeSVG;
}

let prevpercent = 0;
let startTime = null;
let iterations = 0;

function startNesting(fn) {
  // SvgNest.config({
  //   curveTolerance: "0.3",
  //   exploreConcave: false,
  //   mutationRate: "10",
  //   populationSize: "10",
  //   rotations: "4",
  //   spacing: "0",
  //   useHoles: false,
  // });

  prevpercent = 0;
  startTime = null;
  iterations = 0;

  SvgNest.setbin(items.bg);
  SvgNest.start(progress, (svglist, efficiency, placed, total) => {
    renderSvg(svglist, efficiency, placed, total, fn)
  });
  isWorking = true;
}

function stopNesting() {
  SvgNest.stop();
  isWorking = false;
}

function progress(percent) {
  var transition = percent > prevpercent ? '; transition: width 0.1s' : '';
  document.getElementById('info_progress').setAttribute('style','width: '+Math.round(percent*100)+'% ' + transition);
  // document.getElementById('info').setAttribute('style','display: block');
  
  prevpercent = percent;
  
  var now = new Date().getTime();
  if(startTime && now){
    var diff = now-startTime;
    // show a time estimate for long-running placements
    var estimate = (diff/percent)*(1-percent);
    // document.getElementById('info_time').innerHTML = millisecondsToStr(estimate)+' remaining';
    
    // if(diff > 5000 && percent < 0.3 && percent > 0.02 && estimate > 10000){
    //   document.getElementById('info_time').setAttribute('style','display: block');
    // }
  }
  
  // if(percent > 0.95 || percent < 0.02){
  //   document.getElementById('info_time').setAttribute('style','display: none');
  // }
  if(percent < 0.02){
    startTime = new Date().getTime();
  }
}

function renderSvg(svglist, efficiency, placed, total, fn) {
  iterations++;
  // document.getElementById('info_iterations').innerHTML = iterations;
  
  if(!svglist || svglist.length == 0){
    return;
  }
  
  bins.innerHTML = "";
  
  for(var i=0; i < svglist.length; i++){
    if(svglist.length > 2){
      svglist[i].setAttribute('class','grid');
    }
    svglist[i].setAttribute("width", `${binSize.width}mm`);
    svglist[i].setAttribute("height", `${binSize.height}mm`);
    bins.appendChild(svglist[i]);
  }

  if (iterations >= 1) {
    let output = [];
    const results = bins.querySelectorAll("svg");
    // console.log(222, results);
    [...results].forEach((svg, index) => {
      // console.log(svg)
      const svgProps = getSvgProps(svg);
      const value = svgProps.outerRect();
      output.push(value);
    });
    fn(output);
    stopNesting();
  }
  
  // if(efficiency || efficiency === 0){
  //   document.getElementById('info_efficiency').innerHTML = Math.round(efficiency*100);
  // }

  // document.getElementById('info_iterations').innerHTML = iterations;
  // document.getElementById('info_placed').innerHTML = placed+'/'+total;
}