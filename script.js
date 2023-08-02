import getSvgProps from "./js/svg-props.js";

const svgWrapper = document.querySelector(".preview");
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
        // showSvgInfo();
      });
  });
});

document.addEventListener("click", ({ target }) => {
  const { action } = target.dataset;
  const svg = svgWrapper.querySelector("svg");

  if (!action || !svg) {
    return;
  }

  const svgProps = getSvgProps(svg);
  const svgPropAction = svgProps[action];

  result[action].innerHTML = svgPropAction();
});
