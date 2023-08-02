import getSvgProps from "./js/svg-props.js";

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
        // const html = `<div class="svg-wrapper">${svg}<div class="svg-info"></div></div>`;
        svgWrapper.innerHTML = svg;
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