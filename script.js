// Родительский контейнер для загружаемой svg.
const svgWrapper = document.querySelector(".preview");
// SELECT для выбора единиц измерений.
const unitSelect = document.querySelector(".control__select");

// Размер листа в миллиматрах
const binSize = {
  width: 3020,
  height: 2020,
};

// Будет содержать исходную свг и лист, на котором размещаем свг
const items = {
  bg: null,
  svg: null,
};

// HTML-элементы, в которые будем вставлять расчитанные значения
const result = {
  area: document.querySelector(".info--area .result__info-value"),
  length: document.querySelector(".info--length .result__info-value"),
  outerRect: document.querySelector(".info--outerRect .result__info-value"),
};

// Контейнер, в который будут добавленные скомпанованные svg
const bins = document.getElementById("bins"); 
// Просчитывается методом getSvgScale. Нужна для правильного машстабирования элементов.
let scale = 1;
let isWorking = false;

// Обработчик выбора файла
document.querySelector("#fileDialog").addEventListener("change", (event) => {
  [...event.target.files].forEach((item) => {
    const url = window.URL.createObjectURL(item);
    fetch(url)
      .then((response) => response.text())
      .then((svg) => {
        const svgEl = SvgNest.parsesvg(svg);
        const option = unitSelect.options[unitSelect.selectedIndex];
        // Сбрасываем предыдущие значения
        resetResults();
        
        // Добавляем СВГ на страницу. Загруженная свг скрыта стилями. Если её не добавить
        // или скрыть display:none, то расчеты не будут выполнены
        appendSvg(svgEl);

        // option - она может быть либо mm, либо m
        // Передается во внутрь, чтобы конвертировать результаты либо в миллиметры, либо в метры

        // Расчет площади
        result.area.innerHTML = getArea(option);
        // Расчет периметры
        result.length.innerHTML = getLength(option);
        // Запускает компоновку и расчет описанного прямоугольника
        getOuterRect(() => {
          // let output = [];
          // const results = bins.querySelectorAll("svg");
          // [...results].forEach((svg, index) => {
          //   const svgProps = getSvgProps(svg);
          //   const value = svgProps.outerRect();
          //   output.push(value);
          // });

          // result.outerRect.innerHTML = output.map((value, index) => {
          //   return `<span>#${index+1}: ${convertArea(value, option.value)}</span>`;
          // }).join("");
          const resultSvgs = [...bins.querySelectorAll("svg")];
          result.outerRect.innerHTML = resultSvgs.reduce((html, _svg, index) => {
            const svgProps = getSvgProps(_svg);
            const value = svgProps.outerRect();

            html += `<span>#${index+1}: ${convertArea(value, option.value)}</span>`;
            return html;
          }, "");
        })
      });
  });
});

/**
 * @description Сбросить предыдущие измерения.
 */
function resetResults() {
  result.area.innerHTML = "0";
  result.length.innerHTML = "0";
  result.outerRect.innerHTML = "0";
  svgWrapper.innerHTML = "";
  bins.innerHTML = "";
}

/**
 * 
 * @param {HTMLElement} _svg Загруженный свг элемент
 * @description Корректирует исходную свг и добавляет её на страницу. 
 */
function appendSvg(_svg) {
  svgWrapper.appendChild(_svg);
  // Некоторые svg некорретны. Они находятся за пределами Viewbox - за пределами холста.
  // Данный метод getCorrectSvgProps просчитывает новые значения и возвращает их.
  const correctSvgProps = getCorrectSvgProps(_svg);
  // Original SVG
  _svg.setAttribute("width", correctSvgProps.svg.width);
  _svg.setAttribute("height", correctSvgProps.svg.height);
  _svg.setAttribute("viewBox", correctSvgProps.viewbox);
  scale = getSvgScale(_svg);
  // BG RECT
  const bgSvgRect = createBgSvgRect(_svg);
  _svg.classList.add("svg-original");
  // console.log(binSize)
  svgWrapper.appendChild(bgSvgRect);

  items.bg = bgSvgRect.querySelector("rect");
  items.svg = _svg;
  items.bg.setAttribute("width", binSize.width / scale);
  items.bg.setAttribute("height", binSize.height / scale);
}
/**
 * 
 * @param {HTMLElement} option Это выбранный элемент из списка <select></select>
 * @returns Возращает Периметр SVG.
 */
function getLength(option) {
  const svgProps = getSvgProps(items.svg);
  const value = svgProps.length();
  return convertLength(value, option.value);
}
/**
 * 
 * @param {HTMLElement} option Это выбранный элемент из списка <select></select>
 * @returns Возращает площадь SVG.
 */
function getArea(option) {
  const svgProps = getSvgProps(items.svg);
  const value = svgProps.area();
  return convertArea(value, option.value);
}
/**
 * 
 * @param {Function} fn Callback функция, которая запуская после завершения компоновки
 * @description
 */
function getOuterRect(fn) {
  stopNesting();
  startNesting(fn);
}

/**
 * 
 * @param {Number} value 
 * @param {String} unit m|mm - в какую единицу измерения конвертировать
 * @returns {String} Возвращает строку. Например, 100 мм
 */
function convertLength(value, unit) {
  if (unit === "mm") {
    return `${value.toFixed(3)} mm`;
  }

  return `${(value * Math.pow(10, -3)).toFixed(3)} m`;
}

/**
 * 
 * @param {Number} value 
 * @param {String} unit m|mm - в какую единицу измерения конвертировать
 * @returns {String} Возвращает строку. Например, 100 мм
 */
function convertArea(value, unit) {
  if (unit === "mm") {
    return `${value.toFixed(3)} mm`;
  }

  return `${(value * Math.pow(10, -6)).toFixed(3)} m`;
}
/**
 * 
 * @param {HTMLElement} svg Исходная свг
 * @returns {HTMLElement} созданная свг
 * @description Создает Лист, на котором размещается svg. При компоновке размеры листа берутся из этой свг.
 */
function createBgSvgRect(svg) {
  const wholeSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const viewBoxValue = `0 0 ${getNumber(svg.getAttribute('width'))} ${getNumber(svg.getAttribute('height'))}`
  wholeSVG.setAttribute('width', svg.getAttribute('width'));
  wholeSVG.setAttribute('height', svg.getAttribute('height'));
  wholeSVG.setAttribute('viewBox', viewBoxValue);
  wholeSVG.classList.add("svgFullrect");
  const rect = document.createElementNS(wholeSVG.namespaceURI,'rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', getNumber(svg.getAttribute('width')));
  rect.setAttribute('height',getNumber(svg.getAttribute('height')));
  rect.setAttribute('class', 'fullRect');
  wholeSVG.appendChild(rect);

  return wholeSVG;
}


let prevpercent = 0;
let iterations = 0;
/**
 * 
 * @param {Function} fn Callback функция, которая запуская после завершения компоновки
 * @description запускает компоновку
 */
function startNesting(fn) {
  const scale = getSvgScale(items.svg);
  SvgNest.config({
    spacing: 10 * scale,
  });

  prevpercent = 0;
  iterations = 0;

  SvgNest.setbin(items.bg);
  SvgNest.start(progress, (svglist, efficiency, placed, total) => {
    renderSvg(svglist, efficiency, placed, total, fn)
  });
  isWorking = true;
}

/**
 * @description Останавливает компоновку
 */
function stopNesting() {
  SvgNest.stop();
  isWorking = false;
}
/**
 * 
 * @param {Number} percent процент выполнения
 * @description Показывает насколько завершилась компоновка 
 */
function progress(percent) {
  var transition = percent > prevpercent ? '; transition: width 0.1s' : '';
  document.getElementById('info_progress').setAttribute('style','width: '+Math.round(percent*100)+'% ' + transition);
  
  prevpercent = percent;
}
/**
 * 
 * @param {Array} svglist Список скомпонованных svg
 * @param {Function} fn Callback функция, которая запуская после завершения компоновки
 * @description После первой итерации компоновка останавливается и запускает callback функция
 */
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
    fn();
    stopNesting();
  }
}