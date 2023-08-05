// import getSvgProps from "./js/svg-props.js";
// import SvgNest from "./js/svgnest.js";
// import { getSvgScale, getNumber } from "./js/util/utils.js";

const svgWrapper = document.querySelector(".preview");
const unitSelect = document.querySelector(".control__select");

const items = {
  bg: null,
  svg: null,
};

const result = {
  area: document.querySelector(".info--area .result__info-value"),
  length: document.querySelector(".info--length .result__info-value"),
  outerRect: document.querySelector(".info--outerRect .result__info-value"),
};

const fields = {
  width: document.querySelector(".field__item--width"),
  height: document.querySelector(".field__item--height"),
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
        result.area.innerHTML = "0";
        result.length.innerHTML = "0";
        result.outerRect.innerHTML = "0";
        svgWrapper.innerHTML = "";
        bins.innerHTML = "";
        document.getElementById('info_efficiency').innerHTML = "";
        document.getElementById('info_iterations').innerHTML = "";
        document.getElementById('info_placed').innerHTML = "";

        const bgSvgRect = createBgSvgRect(svgEl);
        svgEl.classList.add("svg-original");

        svgWrapper.appendChild(bgSvgRect);
        svgWrapper.appendChild(svgEl);

        items.bg = bgSvgRect.querySelector("rect");
        items.svg = svgEl;
 
        scale = getSvgScale(svgEl);

        fields.width.value = getNumber(bgSvgRect.getAttribute("width"));
        fields.height.value = getNumber(bgSvgRect.getAttribute("height"));
      });
  });
});

document.addEventListener("click", ({ target }) => {
  const { action } = target.dataset;
  const svg = items.svg;
  const option = unitSelect.options[unitSelect.selectedIndex];

  if (!action || !svg) {
    return;
  }

  if (["area", "length", "outerRect"].includes(action)) {
    const svgProps = getSvgProps(svg);
    const svgPropAction = svgProps[action];
    const value = svgPropAction();
  
    result[action].innerHTML = convertToUnit(value, option, action);
  }

  if (action === "outerRectResults") {
    const outerRect = document.querySelector("#bins_outer-rect");
    let output = "";
    const results = bins.querySelectorAll("svg");
    [...results].forEach((svg, index) => {
      const svgProps = getSvgProps(svg);
      const value = svgProps.outerRect();
      // console.log(value, option, action)
      output += `
        <span>Опис. прямоугольник #${index}: ${convertToUnit(value, option, action)}</span>
      `;
      // console.log(svg, svgProps.outerRect());
    });

    outerRect.innerHTML = output;
  }

  if (action === "nest") {
    isWorking ? stopNesting() : startNesting();
  }

  if (action === "download") {
    downloadSvgs();
  }
});

document.addEventListener("input", ({ target }) => {
  if (!target.classList.contains("field__item")) {
    return;
  }

  const value = getNumber(target.value) / scale;

  if (target.classList.contains("field__item--width")) {
    items.bg.setAttribute("width", value);
  }

  if (target.classList.contains("field__item--height")) {
    items.bg.setAttribute("height", value);
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
  wholeSVG.setAttribute('width', svg.getAttribute('width'));
  wholeSVG.setAttribute('height', svg.getAttribute('height'));
  wholeSVG.setAttribute('viewBox', svg.getAttribute('viewBox'));
  wholeSVG.classList.add("svgFullrect");
  const rect = document.createElementNS(wholeSVG.namespaceURI,'rect');
  rect.setAttribute('x', wholeSVG.viewBox.baseVal.x);
  rect.setAttribute('y', wholeSVG.viewBox.baseVal.x);
  rect.setAttribute('width', wholeSVG.viewBox.baseVal.width);
  rect.setAttribute('height', wholeSVG.viewBox.baseVal.height);
  rect.setAttribute('class', 'fullRect');
  wholeSVG.appendChild(rect);

  return wholeSVG;
}

let prevpercent = 0;
let startTime = null;
let iterations = 0;

function startNesting() {
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
  SvgNest.start(progress, renderSvg);
  isWorking = true;

  const button = document.querySelector("[data-action='nest']");
  button.innerHTML = "Остановить";
}

function stopNesting() {
  SvgNest.stop();
  isWorking = false;

  const button = document.querySelector("[data-action='nest']");
  button.innerHTML = "Компоновать элементы";
}

function progress(percent){
  var transition = percent > prevpercent ? '; transition: width 0.1s' : '';
  document.getElementById('info_progress').setAttribute('style','width: '+Math.round(percent*100)+'% ' + transition);
  document.getElementById('info').setAttribute('style','display: block');
  
  prevpercent = percent;
  
  var now = new Date().getTime();
  if(startTime && now){
    var diff = now-startTime;
    // show a time estimate for long-running placements
    var estimate = (diff/percent)*(1-percent);
    // document.getElementById('info_time').innerHTML = millisecondsToStr(estimate)+' remaining';
    
    if(diff > 5000 && percent < 0.3 && percent > 0.02 && estimate > 10000){
      document.getElementById('info_time').setAttribute('style','display: block');
    }
  }
  
  if(percent > 0.95 || percent < 0.02){
    document.getElementById('info_time').setAttribute('style','display: none');
  }
  if(percent < 0.02){
    startTime = new Date().getTime();
  }
}

function renderSvg(svglist, efficiency, placed, total) {
  iterations++;
  if (iterations >= 5) {
    stopNesting();
  }
  document.getElementById('info_iterations').innerHTML = iterations;
  
  if(!svglist || svglist.length == 0){
    return;
  }
  
  bins.innerHTML = "";
  
  for(var i=0; i < svglist.length; i++){
    if(svglist.length > 2){
      svglist[i].setAttribute('class','grid');
    }
    svglist[i].setAttribute("width", `${fields.width.value}mm`);
    svglist[i].setAttribute("height", `${fields.height.value}mm`);
    bins.appendChild(svglist[i]);
  }
  
  if(efficiency || efficiency === 0){
    document.getElementById('info_efficiency').innerHTML = Math.round(efficiency*100);
  }

  document.getElementById('info_iterations').innerHTML = iterations;
  document.getElementById('info_placed').innerHTML = placed+'/'+total;
}

function downloadSvgs() {  
  const svgs = bins.querySelectorAll("svg");

  [...svgs].forEach((item, index) => {
    const svg = item.cloneNode(true);
    svg.querySelector(".bin").remove();
    svg.setAttribute("fill", "#fff");
    svg.setAttribute("stroke", "#3bb34a");
    let output;
    if(typeof XMLSerializer != 'undefined'){
      output = (new XMLSerializer()).serializeToString(svg);
    } else {
      output = svg.outerHTML;
    }

    let blob = new Blob([output], {type: "image/svg+xml;charset=utf-8"});
    saveAs(blob, `output_${index}.svg`);
  });
}