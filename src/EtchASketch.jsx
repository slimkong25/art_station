import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "./EtchASketch.css";


const palettes = [
  ["#FF6B6B", "#F7B267", "#FFE29A", "#355070", "#2F3C7E"],
  ["#6C2BD9", "#00D9FF", "#FF3CAC", "#FFD93D", "#111111"],
  ["#173F35", "#386641", "#6A994E", "#F2E8CF", "#BC6C25"],
  ["#023E8A", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"],
  ["#590D22", "#800F2F", "#C9184A", "#FF4D6D", "#FFCCD5"],
  ["#3B3024", "#6B705C", "#A5A58D", "#CB997E", "#FFE8D6"],
  ["#10002B", "#240046", "#5A189A", "#9D4EDD", "#E0AAFF"],
  ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
  ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#C6F91F"],
  ["#5F0F40", "#9A031E", "#FB8B24", "#E36414", "#FFF3B0"],
  ["#FF99C8", "#FCF6BD", "#D0F4DE", "#A9DEF9", "#E4C1F9"],
  ["#101010", "#343434", "#6B6B6B", "#B8B8B8", "#F2F2F2"],
  ["#240046", "#5A189A", "#FF5400", "#FFBD00", "#FFF3B0"],
  ["#D62828", "#F77F00", "#FCBF49", "#003049", "#EAE2B7"],
  ["#03071E", "#370617", "#6A040F", "#0A9396", "#94D2BD"],
  ["#283618", "#606C38", "#A3B18A", "#DAD7CD", "#BC6C25"],
  ["#09090B", "#FF0054", "#FF5400", "#39FF14", "#00E5FF"],
  ["#1B262C", "#3C6E71", "#D9D9D9", "#D9BF77", "#7F5539"],
];


function EtchASketch() {




  /* =========================
     STATE
  ========================== */

  const [gridSize, setGridSize] =
    useState(32);

  const [cells, setCells] =
    useState(() =>
      Array(32 * 32).fill("white")
    );

  const [color, setColor] =
    useState("#111111");

  const [isEraser, setIsEraser] =
    useState(false);

  const [palette, setPalette] =
    useState(palettes[0]);

  const [isDrawing, setIsDrawing] =
    useState(false);

  const [format, setFormat] =
    useState("png");


  const undoStack =
    useRef([]);

  const redoStack =
    useRef([]);

  const strokeBeforeState =
    useRef(null);

  const containerRef =
    useRef(null);


  /* =========================
     CANVAS STATE
  ========================== */

  function getCanvasState() {
    return [...cells];
  }


  /* =========================
     PAINT CELL
  ========================== */

  function paintCell(index) {

    if (
      index === null ||
      index === undefined
    ) {
      return;
    }


    setCells(current => {

      const next = [...current];

      next[index] =
        isEraser
          ? "white"
          : color;

      return next;

    });

  }


  /* =========================
     FIND CELL FROM TOUCH
  ========================== */

  function getCellFromPoint(
    clientX,
    clientY
  ) {

    const element =
      document.elementFromPoint(
        clientX,
        clientY
      );


    const square =
      element?.closest(".square");


    if (
      !square ||
      !containerRef.current?.contains(
        square
      )
    ) {
      return null;
    }


    return Number(
      square.dataset.index
    );

  }


  /* =========================
     START DRAWING
  ========================== */

  function startDrawing(event) {

    event.preventDefault();

    strokeBeforeState.current =
      getCanvasState();


    setIsDrawing(true);


    const index =
      getCellFromPoint(
        event.clientX,
        event.clientY
      );


    if (index !== null) {
      paintCell(index);
    }


    try {
      containerRef.current?.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture may be unavailable
    }

  }


  /* =========================
     DRAW
  ========================== */

  function draw(event) {

    if (!isDrawing) {
      return;
    }


    event.preventDefault();


    const index =
      getCellFromPoint(
        event.clientX,
        event.clientY
      );


    if (index !== null) {
      paintCell(index);
    }

  }


  /* =========================
     FINISH DRAWING
  ========================== */

  function finishDrawing(event) {

    if (!isDrawing) {
      return;
    }


    setCells(current => {

      const before =
        strokeBeforeState.current;


      if (before) {

        const changed =
          JSON.stringify(before) !==
          JSON.stringify(current);


        if (changed) {

          undoStack.current.push(
            [...before]
          );


          if (
            undoStack.current.length > 50
          ) {
            undoStack.current.shift();
          }


          redoStack.current = [];

        }

      }


      return current;

    });


    strokeBeforeState.current =
      null;

    setIsDrawing(false);


    try {

      if (
        event &&
        containerRef.current?.hasPointerCapture(
          event.pointerId
        )
      ) {

        containerRef.current.releasePointerCapture(
          event.pointerId
        );

      }

    } catch {
      // Ignore pointer release errors
    }

  }


  /* =========================
     CHANGE GRID
  ========================== */

  function changeGrid(size) {

    setGridSize(size);


    setCells(
      Array(size * size).fill("white")
    );


    undoStack.current = [];

    redoStack.current = [];

    strokeBeforeState.current =
      null;

    setIsDrawing(false);

  }


  /* =========================
     CLEAR
  ========================== */

  function clearCanvas() {

    const before =
      [...cells];


    const alreadyClear =
      cells.every(
        cell =>
          cell === "white"
      );


    if (!alreadyClear) {

      undoStack.current.push(
        before
      );


      redoStack.current = [];

    }


    setCells(
      Array(gridSize * gridSize)
        .fill("white")
    );

  }


  /* =========================
     UNDO
  ========================== */

  function undo() {

    if (
      undoStack.current.length === 0
    ) {
      return;
    }


    const current =
      [...cells];


    const previous =
      undoStack.current.pop();


    redoStack.current.push(
      current
    );


    setCells(
      previous
    );

  }


  /* =========================
     REDO
  ========================== */

  function redo() {

    if (
      redoStack.current.length === 0
    ) {
      return;
    }


    const current =
      [...cells];


    const next =
      redoStack.current.pop();


    undoStack.current.push(
      current
    );


    setCells(
      next
    );

  }


  /* =========================
     COLOR
  ========================== */

  function chooseColor(
    newColor
  ) {

    setColor(
      newColor.toUpperCase()
    );


    setIsEraser(false);

  }


  function handleColorPicker(
    event
  ) {

    setColor(
      event.target.value
        .toUpperCase()
    );


    setIsEraser(false);

  }


  /* =========================
     MAGIC PALETTE
  ========================== */

  function generateMagicPalette() {

    let randomIndex =
      Math.floor(
        Math.random() *
        palettes.length
      );


    setPalette(
      palettes[randomIndex]
    );

  }


  /* =========================
     EXPORT CANVAS
  ========================== */

  function createExportCanvas() {

    const exportSize =
      1200;


    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      exportSize;

    canvas.height =
      exportSize;


    const ctx =
      canvas.getContext("2d");


    const cellSize =
      exportSize / gridSize;


    ctx.fillStyle =
      "white";


    ctx.fillRect(
      0,
      0,
      exportSize,
      exportSize
    );


    cells.forEach(
      (cellColor, index) => {

        if (
          !cellColor ||
          cellColor === "white" ||
          cellColor ===
            "rgb(255, 255, 255)"
        ) {
          return;
        }


        const row =
          Math.floor(
            index / gridSize
          );


        const column =
          index % gridSize;


        ctx.fillStyle =
          cellColor;


        ctx.fillRect(
          column * cellSize,
          row * cellSize,
          cellSize,
          cellSize
        );

      }
    );


    return canvas;

  }


  /* =========================
     DOWNLOAD
  ========================== */

  function downloadFile(
    dataUrl,
    extension
  ) {

    const link =
      document.createElement(
        "a"
      );


    link.download =
      `etch-a-sketch.${extension}`;


    link.href =
      dataUrl;


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );

  }


  /* =========================
     SAVE
  ========================== */

  function saveArtwork() {

    const canvas =
      createExportCanvas();


    if (format === "png") {

      downloadFile(
        canvas.toDataURL(
          "image/png"
        ),
        "png"
      );


      return;
    }


    if (format === "jpg") {

      downloadFile(
        canvas.toDataURL(
          "image/jpeg",
          0.95
        ),
        "jpg"
      );


      return;
    }


    if (format === "webp") {

      downloadFile(
        canvas.toDataURL(
          "image/webp",
          0.95
        ),
        "webp"
      );


      return;
    }


    if (format === "pdf") {

      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit: "mm",

          format: "a4",
        });


      const image =
        canvas.toDataURL(
          "image/png"
        );


      const pageWidth =
        pdf.internal.pageSize
          .getWidth();


      const pageHeight =
        pdf.internal.pageSize
          .getHeight();


      const margin =
        15;


      const size =
        Math.min(
          pageWidth -
            margin * 2,

          pageHeight -
            margin * 2
        );


      const x =
        (pageWidth - size) /
        2;


      const y =
        (pageHeight - size) /
        2;


      pdf.addImage(
        image,
        "PNG",
        x,
        y,
        size,
        size
      );


      pdf.save(
        "etch-a-sketch.pdf"
      );

    }

  }


  return (

    <main className="etch-page">

      {/* =========================
          BACK
      ========================== */}

      

      {/* =========================
          WORKSPACE
      ========================== */}

      <section className="etch-workspace">


        {/* =========================
            DRAWING
        ========================== */}

        <div className="drawing-area">

          <div
            ref={containerRef}
            className="container"

            style={{
              gridTemplateColumns:
                `repeat(${gridSize}, 1fr)`,

              gridTemplateRows:
                `repeat(${gridSize}, 1fr)`,
            }}

            onPointerDown={
              startDrawing
            }

            onPointerMove={
              draw
            }

            onPointerUp={
              finishDrawing
            }

            onPointerCancel={
              finishDrawing
            }
          >

            {cells.map(
              (cellColor, index) => (

                <div
                  key={index}

                  data-index={index}

                  className="square"

                  style={{
                    backgroundColor:
                      cellColor,
                  }}
                />

              )
            )}

          </div>

        </div>


        {/* =========================
            TOOLS
        ========================== */}

        <aside className="tool-panel">


          {/* TOOLS */}

          <div className="tool-section">

            <span className="tool-label">
              TOOLS
            </span>


            <button
              className="tool-button"
              type="button"
              onClick={
                clearCanvas
              }
            >
              CLEAR
            </button>


            <button
              className={
                isEraser
                  ? "tool-button active"
                  : "tool-button"
              }
              type="button"
              onClick={() =>
                setIsEraser(
                  current =>
                    !current
                )
              }
            >
              ERASER
            </button>


            <div className="undo-redo">

              <button
                className="tool-button"
                type="button"
                onClick={undo}
              >
                UNDO
              </button>


              <button
                className="tool-button"
                type="button"
                onClick={redo}
              >
                REDO
              </button>

            </div>

          </div>


          {/* GRID */}

          <div className="tool-section">

            <span className="tool-label">
              GRID
            </span>


            <div className="grid-options">

              {[16, 24, 32, 48, 64].map(
                size => (

                  <button
                    key={size}

                    className={
                      gridSize === size
                        ? "grid-size active"
                        : "grid-size"
                    }

                    type="button"

                    onClick={() =>
                      changeGrid(size)
                    }
                  >
                    {size}
                  </button>

                )
              )}

            </div>

          </div>


          {/* COLOR */}

          <div className="tool-section">

            <span className="tool-label">
              COLOR
            </span>


            <div
              className="color-picker-row"
            >

              <input
                className="color-picker"

                type="color"

                value={color}

                onChange={
                  handleColorPicker
                }
              />


              <span className="current-color">
                {color}
              </span>

            </div>

          </div>


          {/* PALETTE */}

          <div className="tool-section">

            <span className="tool-label">
              PALETTE
            </span>


            <button
              className="magic-button"

              type="button"

              onClick={
                generateMagicPalette
              }
            >
              MAGIC ✦
            </button>


            <div className="palette">

              {palette.map(
                paletteColor => (

                  <button
                    key={paletteColor}

                    type="button"

                    className={
                      color ===
                      paletteColor.toUpperCase()
                        ? "palette-color active"
                        : "palette-color"
                    }

                    style={{
                      backgroundColor:
                        paletteColor,
                    }}

                    title={
                      paletteColor
                    }

                    onClick={() =>
                      chooseColor(
                        paletteColor
                      )
                    }
                  />

                )
              )}

            </div>

          </div>


          {/* EXPORT */}

          <div className="tool-section">

            <span className="tool-label">
              EXPORT
            </span>


            <div className="save-area">

              <select
                className="save-format"

                value={format}

                onChange={
                  event =>
                    setFormat(
                      event.target.value
                    )
                }
              >

                <option value="png">
                  PNG
                </option>

                <option value="jpg">
                  JPG
                </option>

                <option value="webp">
                  WEBP
                </option>

                <option value="pdf">
                  PDF
                </option>

              </select>


              <button
                className="tool-button"

                type="button"

                onClick={
                  saveArtwork
                }
              >
                SAVE
              </button>

            </div>

          </div>

        </aside>

      </section>

    </main>
  );
}


export default EtchASketch;