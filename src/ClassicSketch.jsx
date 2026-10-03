import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  PenLine,
  Paintbrush,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "./ClassicSketch.css";


const TOOLS = {
  pen: {
    label: "PEN",
    icon: PenLine,
    size: 3,
    opacity: 1,
  },

  pencil: {
    label: "PENCIL",
    icon: Pencil,
    size: 2,
    opacity: 0.55,
  },

  brush: {
    label: "BRUSH",
    icon: Paintbrush,
    size: 18,
    opacity: 0.28,
  },

  pastel: {
    label: "OIL PASTEL",
    icon: Paintbrush,
    size: 16,
    opacity: 0.55,
  },

  eraser: {
    label: "ERASER",
    icon: Eraser,
    size: 30,
    opacity: 1,
  },
};


function ClassicSketch() {

  const canvasRef = useRef(null);

  const drawingRef = useRef(false);

  const currentStrokeRef = useRef(null);

  const historyRef = useRef([]);

  const historyIndexRef = useRef(-1);


  const [tool, setTool] =
    useState("pencil");

  const [color, setColor] =
    useState("#111111");

  const [format, setFormat] =
    useState("png");

  const [historyIndex, setHistoryIndex] =
    useState(-1);


  /* =========================
     CANVAS SIZE
  ========================== */

  const CANVAS_SIZE = 1200;


  /* =========================
     GET CONTEXT
  ========================== */

  function getContext() {

    return canvasRef.current?.getContext(
      "2d"
    );

  }


  /* =========================
     GET POINTER POSITION
  ========================== */

  function getPoint(event) {

    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();


    return {
      x:
        (event.clientX - rect.left) *
        (canvas.width / rect.width),

      y:
        (event.clientY - rect.top) *
        (canvas.height / rect.height),
    };

  }


  /* =========================
     DRAW ONE SEGMENT
  ========================== */

  function drawSegment(
    ctx,
    from,
    to,
    stroke
  ) {

    const settings =
      TOOLS[stroke.tool];


    ctx.save();


    if (
      stroke.tool === "eraser"
    ) {

      ctx.globalCompositeOperation =
        "destination-out";

      ctx.globalAlpha = 1;

    } else {

      ctx.globalCompositeOperation =
        "source-over";

      ctx.globalAlpha =
        settings.opacity;

    }


    ctx.strokeStyle =
      stroke.color;


    ctx.lineWidth =
      settings.size;


    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";


    /*
     * Oil pastel gets a slightly
     * rougher/tactile treatment.
     */

    if (
      stroke.tool === "pastel"
    ) {

      ctx.globalAlpha =
        0.35;


      ctx.lineWidth =
        settings.size;


      ctx.beginPath();

      ctx.moveTo(
        from.x,
        from.y
      );

      ctx.lineTo(
        to.x,
        to.y
      );

      ctx.stroke();


      /*
       * Small deterministic marks
       * create texture without using
       * random values, so redraws stay
       * identical.
       */

      for (
        let i = 0;
        i < 3;
        i++
      ) {

        const offsetX =
          Math.sin(
            from.x * 0.03 +
            i * 8
          ) * 4;

        const offsetY =
          Math.cos(
            from.y * 0.03 +
            i * 11
          ) * 4;


        ctx.beginPath();

        ctx.moveTo(
          from.x + offsetX,
          from.y + offsetY
        );

        ctx.lineTo(
          to.x + offsetX,
          to.y + offsetY
        );

        ctx.stroke();

      }

    } else {

      ctx.beginPath();

      ctx.moveTo(
        from.x,
        from.y
      );

      ctx.lineTo(
        to.x,
        to.y
      );

      ctx.stroke();

    }


    ctx.restore();

  }


  /* =========================
     DRAW COMPLETE STROKE
  ========================== */

  function drawStroke(
    ctx,
    stroke
  ) {

    const points =
      stroke.points;


    if (!points.length) {
      return;
    }


    /*
     * Dot for a single click.
     */

    if (points.length === 1) {

      const settings =
        TOOLS[stroke.tool];


      ctx.save();


      if (
        stroke.tool === "eraser"
      ) {

        ctx.globalCompositeOperation =
          "destination-out";

        ctx.globalAlpha = 1;

      } else {

        ctx.globalCompositeOperation =
          "source-over";

        ctx.globalAlpha =
          settings.opacity;

      }


      ctx.fillStyle =
        stroke.color;


      ctx.beginPath();

      ctx.arc(
        points[0].x,
        points[0].y,
        settings.size / 2,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();


      return;
    }


    for (
      let i = 1;
      i < points.length;
      i++
    ) {

      drawSegment(
        ctx,
        points[i - 1],
        points[i],
        stroke
      );

    }

  }


  /* =========================
     REDRAW HISTORY
  ========================== */

  function redraw() {

    const ctx =
      getContext();

    if (!ctx) {
      return;
    }


    ctx.clearRect(
      0,
      0,
      CANVAS_SIZE,
      CANVAS_SIZE
    );


    const visibleStrokes = [];


    const history =
      historyRef.current;


    const index =
      historyIndexRef.current;


    for (
      let i = 0;
      i <= index;
      i++
    ) {

      const action =
        history[i];


      if (
        action.type === "clear"
      ) {

        ctx.clearRect(
          0,
          0,
          CANVAS_SIZE,
          CANVAS_SIZE
        );


        visibleStrokes.length = 0;

      } else {

        visibleStrokes.push(
          action.stroke
        );

      }

    }


    visibleStrokes.forEach(
      stroke => {

        drawStroke(
          ctx,
          stroke
        );

      }
    );

  }


  /* =========================
     INITIAL CANVAS
  ========================== */

  useEffect(() => {

    redraw();

  }, [historyIndex]);


  /* =========================
     START DRAWING
  ========================== */

  function startDrawing(event) {

    event.preventDefault();


    const point =
      getPoint(event);


    drawingRef.current = true;


    currentStrokeRef.current = {

      tool,

      color,

      points: [
        point
      ],

    };


    const ctx =
      getContext();


    if (!ctx) {
      return;
    }


    /*
     * Draw a point immediately.
     */

    drawStroke(
      ctx,
      currentStrokeRef.current
    );


    try {

      canvasRef.current.setPointerCapture(
        event.pointerId
      );

    } catch {
      // Ignore unsupported capture
    }

  }


  /* =========================
     CONTINUE DRAWING
  ========================== */

  function continueDrawing(event) {

    if (
      !drawingRef.current
    ) {
      return;
    }


    event.preventDefault();


    const point =
      getPoint(event);


    const stroke =
      currentStrokeRef.current;


    if (!stroke) {
      return;
    }


    const previous =
      stroke.points[
        stroke.points.length - 1
      ];


    stroke.points.push(
      point
    );


    const ctx =
      getContext();


    if (!ctx) {
      return;
    }


    drawSegment(
      ctx,
      previous,
      point,
      stroke
    );

  }


  /* =========================
     FINISH DRAWING
  ========================== */

  function finishDrawing(event) {

    if (
      !drawingRef.current
    ) {
      return;
    }


    const stroke =
      currentStrokeRef.current;


    if (stroke) {

      const history =
        historyRef.current.slice(
          0,
          historyIndexRef.current + 1
        );


      history.push({
        type: "stroke",
        stroke: {
          ...stroke,
          points: [
            ...stroke.points
          ],
        },
      });


      historyRef.current =
        history;


      historyIndexRef.current =
        history.length - 1;


      setHistoryIndex(
        historyIndexRef.current
      );

    }


    drawingRef.current =
      false;

    currentStrokeRef.current =
      null;


    try {

      if (
        canvasRef.current &&
        canvasRef.current.hasPointerCapture(
          event.pointerId
        )
      ) {

        canvasRef.current.releasePointerCapture(
          event.pointerId
        );

      }

    } catch {
      // Ignore unsupported capture
    }

  }


  /* =========================
     TOOL
  ========================== */

  function chooseTool(
    selectedTool
  ) {

    setTool(
      selectedTool
    );

  }


  /* =========================
     COLOR
  ========================== */

  function changeColor(event) {

    setColor(
      event.target.value
        .toUpperCase()
    );


    if (tool === "eraser") {

      setTool(
        "pencil"
      );

    }

  }


  /* =========================
     UNDO
  ========================== */

  function undo() {

    if (
      historyIndexRef.current < 0
    ) {
      return;
    }


    historyIndexRef.current -= 1;


    setHistoryIndex(
      historyIndexRef.current
    );

  }


  /* =========================
     REDO
  ========================== */

  function redo() {

    if (
      historyIndexRef.current >=
      historyRef.current.length - 1
    ) {
      return;
    }


    historyIndexRef.current += 1;


    setHistoryIndex(
      historyIndexRef.current
    );

  }


  /* =========================
     CLEAR
  ========================== */

  function clearCanvas() {

    const history =
      historyRef.current.slice(
        0,
        historyIndexRef.current + 1
      );


    history.push({
      type: "clear",
    });


    historyRef.current =
      history;


    historyIndexRef.current =
      history.length - 1;


    setHistoryIndex(
      historyIndexRef.current
    );

  }


  /* =========================
     EXPORT CANVAS
  ========================== */

  function createExportCanvas() {

    const output =
      document.createElement(
        "canvas"
      );


    output.width =
      CANVAS_SIZE;

    output.height =
      CANVAS_SIZE;


    const ctx =
      output.getContext("2d");


    /*
     * Paper background.
     */

    ctx.fillStyle =
      "#FBF8F1";


    ctx.fillRect(
      0,
      0,
      CANVAS_SIZE,
      CANVAS_SIZE
    );


    /*
     * Draw transparent artwork
     * over the paper.
     */

    ctx.drawImage(
      canvasRef.current,
      0,
      0
    );


    return output;

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
      `classic-sketch.${extension}`;


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


    if (
      format === "png"
    ) {

      downloadFile(
        canvas.toDataURL(
          "image/png"
        ),
        "png"
      );


      return;
    }


    if (
      format === "jpg"
    ) {

      downloadFile(
        canvas.toDataURL(
          "image/jpeg",
          0.95
        ),
        "jpg"
      );


      return;
    }


    if (
      format === "webp"
    ) {

      downloadFile(
        canvas.toDataURL(
          "image/webp",
          0.95
        ),
        "webp"
      );


      return;
    }


    if (
      format === "pdf"
    ) {

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
        "classic-sketch.pdf"
      );

    }

  }


  const ToolIcon =
    TOOLS[tool].icon;


  return (

    <section className="classic-workspace">


      {/* =========================
          PAPER
      ========================== */}

      <div className="classic-drawing-area">

        <canvas
          ref={canvasRef}

          width={CANVAS_SIZE}
          height={CANVAS_SIZE}

          className="classic-canvas"

          onPointerDown={
            startDrawing
          }

          onPointerMove={
            continueDrawing
          }

          onPointerUp={
            finishDrawing
          }

          onPointerCancel={
            finishDrawing
          }
        />

      </div>


      {/* =========================
          TOOL PANEL
      ========================== */}

      <aside className="classic-tool-panel">


        {/* TOOLS */}

        <div className="classic-tool-section">

          <span className="classic-label">
            TOOLS
          </span>


          {[
            "pen",
            "pencil",
            "brush",
            "pastel",
            "eraser",
          ].map(
            toolName => {

              const Icon =
                TOOLS[toolName].icon;


              return (

                <button
                  key={toolName}

                  type="button"

                  className={
                    tool === toolName
                      ? "classic-tool-button active"
                      : "classic-tool-button"
                  }

                  onClick={() =>
                    chooseTool(
                      toolName
                    )
                  }
                >

                  <Icon
                    size={16}
                    strokeWidth={1.8}
                  />

                  <span>
                    {
                      TOOLS[
                        toolName
                      ].label
                    }
                  </span>

                </button>

              );

            }
          )}

        </div>


        {/* COLOR */}

        <div className="classic-tool-section">

          <span className="classic-label">
            COLOUR
          </span>


          <div className="classic-color-row">

            <input
              type="color"

              className="classic-color-picker"

              value={color}

              onChange={
                changeColor
              }
            />


            <span className="classic-hex">
              {color}
            </span>

          </div>

        </div>


        {/* HISTORY */}

        <div className="classic-tool-section">

          <span className="classic-label">
            HISTORY
          </span>


          <div className="classic-history">

            <button
              type="button"
              className="classic-small-button"

              onClick={undo}

              disabled={
                historyIndex < 0
              }
            >
              <RotateCcw size={15} />
              UNDO
            </button>


            <button
              type="button"
              className="classic-small-button"

              onClick={redo}

              disabled={
                historyIndex >=
                historyRef.current.length - 1
              }
            >
              <RotateCw size={15} />
              REDO
            </button>

          </div>


          <button
            type="button"
            className="classic-tool-button"

            onClick={
              clearCanvas
            }
          >
            <Trash2 size={16} />
            CLEAR
          </button>

        </div>


        {/* EXPORT */}

        <div className="classic-tool-section">

          <span className="classic-label">
            EXPORT
          </span>


          <div className="classic-save">

            <select
              value={format}

              onChange={
                event =>
                  setFormat(
                    event.target.value
                  )
              }

              className="classic-format"
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
              type="button"

              className="classic-save-button"

              onClick={
                saveArtwork
              }
            >
              <Download size={16} />
              SAVE
            </button>

          </div>

        </div>


        {/* CURRENT TOOL */}

        <div className="classic-current-tool">

          <ToolIcon size={14} />

          {TOOLS[tool].label}

        </div>

      </aside>

    </section>
  );
}


export default ClassicSketch;