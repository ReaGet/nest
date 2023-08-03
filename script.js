import getSvgProps from "./js/svg-props.js";
import parsesvg from "./js/svgparser.js";
import SvgNest from "./js/svgnest.js";

const svgWrapper = document.querySelector(".preview");
const unitSelect = document.querySelector(".control__select");
const result = {
  area: document.querySelector(".info--area .result__info-value"),
  length: document.querySelector(".info--length .result__info-value"),
};

document.querySelector("#fileDialog").addEventListener("change", (event) => {
  [...event.target.files].forEach((item) => {
    const url = window.URL.createObjectURL(item);
    fetch(url)
      .then((response) => response.text())
      .then((svg) => {
        const svgEl = SvgNest.parsesvg(svg);
        result.area.innerHTML = "0";
        result.length.innerHTML = "0";
        createBgSvgRect(svgEl);
        svgWrapper.appendChild(svgEl);
      });
  });
});

document.addEventListener("click", ({ target }) => {
  const { action } = target.dataset;
  const svg = svgWrapper.querySelector("svg");
  const option = unitSelect.options[unitSelect.selectedIndex];

  if (!action || !svg) {
    return;
  }

  const svgProps = getSvgProps(svg);
  const svgPropAction = svgProps[action];
  const value = svgPropAction();

  result[action].innerHTML = convertToUnit(value, option, action);
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
      if (unitType === "area") {
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
  var rect = document.createElementNS(wholeSVG.namespaceURI,'rect');
  rect.setAttribute('x', wholeSVG.viewBox.baseVal.x);
  rect.setAttribute('y', wholeSVG.viewBox.baseVal.x);
  rect.setAttribute('width', wholeSVG.viewBox.baseVal.width);
  rect.setAttribute('height', wholeSVG.viewBox.baseVal.height);
  rect.setAttribute('class', 'fullRect');
  wholeSVG.appendChild(rect);
  svgWrapper.appendChild(wholeSVG);
}