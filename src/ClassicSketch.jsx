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
  Palette,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "./ClassicSketch.css";


const TOOLS = {
  pen: {
    label: "PEN",
    icon: PenLine,
    defaultSize: 3,
    minSize: 1,
    maxSize: 20,
    opacity: 1,
  },

  pencil: {
    label: "PENCIL",
    icon: Pencil,
    defaultSize: 2,
    minSize: 1,
    maxSize: 12,
    opacity: 0.48,
  },

  brush: {
    label: "BRUSH",
    icon: Paintbrush,
    defaultSize: 18,
    minSize: 3,
    maxSize: 70,
    opacity: 0.22,
  },

  pastel: {
    label: "OIL PASTEL",
    icon: Palette,
    defaultSize: 22,
    minSize: 5,
    maxSize: 80,
    opacity: 0.38,
  },

  eraser: {
    label: "ERASER",
    icon: Eraser,
    defaultSize: 30,
    minSize: 5,
    maxSize: 100,
    opacity: 1,
  },
};


const DEFAULT_SIZES = Object.fromEntries(
  Object.entries(TOOLS).map(
    ([key, value]) => [
      key,
      value.defaultSize,
    ]
  )
);


function midpoint(a, b) {

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };

}


function ClassicSketch() {

  const canvasRef =
    useRef(null);

  const drawingRef =
    useRef(false);

  const currentStrokeRef =
    useRef(null);

  const historyRef =
    useRef([]);

  const historyIndexRef =
    useRef(-1);


  const [tool, setTool] =
    useState("pencil");

  const [color, setColor] =
    useState("#111111");

  const [format, setFormat] =
    useState("png");

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  const [toolSizes, setToolSizes] =
    useState(DEFAULT_SIZES);


  const CANVAS_SIZE =
    1200;


  const thickness =
    toolSizes[tool];


  /* =========================
     CONTEXT
  ========================== */

  function getContext() {

    return canvasRef.current?.getContext(
      "2d"
    );

  }


  /* =========================
     POINT
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
     TOOL SETTINGS
  ========================== */

  function applyToolStyle(
    ctx,
    stroke,
    sizeOverride = null
  ) {

    const settings =
      TOOLS[stroke.tool];

    const size =
      sizeOverride ?? stroke.size;


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

    ctx.fillStyle =
      stroke.color;

    ctx.lineWidth =
      size;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";


    /*
     * Brush gets soft edges and
     * overlapping ink.
     */

    if (
      stroke.tool === "brush"
    ) {

      ctx.shadowColor =
        stroke.color;

      ctx.shadowBlur =
        size * 0.45;

      ctx.globalAlpha =
        0.16;

    }


    ctx.restore();

  }


  /* =========================
     DRAW DOT
  ========================== */

  function drawDot(
    ctx,
    point,
    stroke
  ) {

    const settings =
      TOOLS[stroke.tool];

    const size =
      stroke.size;


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


    if (
      stroke.tool === "brush"
    ) {

      ctx.shadowColor =
        stroke.color;

      ctx.shadowBlur =
        size * 0.5;

      ctx.globalAlpha =
        0.16;

    }


    ctx.beginPath();

    ctx.arc(
      point.x,
      point.y,
      size / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

  }


  /* =========================
     DRAW SMOOTH PATH
  ========================== */

  function drawSmoothPath(
    ctx,
    points,
    stroke,
    offsetX = 0,
    offsetY = 0,
    opacityOverride = null,
    sizeOverride = null
  ) {

    if (
      !points ||
      points.length === 0
    ) {
      return;
    }


    const settings =
      TOOLS[stroke.tool];


    const size =
      sizeOverride ?? stroke.size;


    ctx.save();


    if (
      stroke.tool === "eraser"
    ) {

      ctx.globalCompositeOperation =
        "destination-out";

      ctx.globalAlpha =
        1;

    } else {

      ctx.globalCompositeOperation =
        "source-over";

      ctx.globalAlpha =
        opacityOverride ??
        settings.opacity;

    }


    ctx.strokeStyle =
      stroke.color;

    ctx.lineWidth =
      size;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";


    /*
     * Soft brush edge.
     */

    if (
      stroke.tool === "brush"
    ) {

      ctx.shadowColor =
        stroke.color;

      ctx.shadowBlur =
        size * 0.45;

    }


    ctx.beginPath();


    if (
      points.length === 1
    ) {

      ctx.arc(
        points[0].x + offsetX,
        points[0].y + offsetY,
        size / 2,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        stroke.color;

      ctx.fill();

      ctx.restore();

      return;

    }


    ctx.moveTo(
      points[0].x + offsetX,
      points[0].y + offsetY
    );


    if (
      points.length === 2
    ) {

      ctx.lineTo(
        points[1].x + offsetX,
        points[1].y + offsetY
      );

    } else {

      for (
        let i = 1;
        i < points.length - 1;
        i++
      ) {

        const current =
          points[i];

        const next =
          points[i + 1];

        const mid =
          midpoint(
            current,
            next
          );


        ctx.quadraticCurveTo(
          current.x + offsetX,
          current.y + offsetY,
          mid.x + offsetX,
          mid.y + offsetY
        );

      }


      const secondLast =
        points[
          points.length - 2
        ];

      const last =
        points[
          points.length - 1
        ];


      ctx.quadraticCurveTo(
        secondLast.x + offsetX,
        secondLast.y + offsetY,
        last.x + offsetX,
        last.y + offsetY
      );

    }


    ctx.stroke();

    ctx.restore();

  }


  /* =========================
     DRAW STROKE
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
     * NORMAL TOOLS
     */

    if (
      stroke.tool !== "pastel"
    ) {

      drawSmoothPath(
        ctx,
        points,
        stroke
      );

      return;

    }


    /*
     * OIL PASTEL
     *
     * Several soft layers give
     * it more body and flow.
     */

    drawSmoothPath(
      ctx,
      points,
      stroke,
      0,
      0,
      0.24,
      stroke.size * 1.1
    );


    drawSmoothPath(
      ctx,
      points,
      stroke,
      -0.7,
      0.6,
      0.10,
      stroke.size * 0.9
    );


    drawSmoothPath(
      ctx,
      points,
      stroke,
      0.8,
      -0.5,
      0.08,
      stroke.size * 0.85
    );

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


    const visibleActions =
      historyRef.current.slice(
        0,
        historyIndexRef.current + 1
      );


    visibleActions.forEach(
      action => {

        if (
          action.type === "clear"
        ) {

          ctx.clearRect(
            0,
            0,
            CANVAS_SIZE,
            CANVAS_SIZE
          );

          return;

        }


        if (
          action.type === "stroke"
        ) {

          drawStroke(
            ctx,
            action.stroke
          );

        }

      }
    );

  }


  /* =========================
     REDRAW ON HISTORY CHANGE
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


    drawingRef.current =
      true;


    currentStrokeRef.current = {

      tool,

      color,

      size: thickness,

      points: [
        point
      ],

    };


    const ctx =
      getContext();


    if (ctx) {

      drawDot(
        ctx,
        point,
        currentStrokeRef.current
      );

    }


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


    const stroke =
      currentStrokeRef.current;


    if (!stroke) {
      return;
    }


    /*
     * Pointer Events can provide
     * extra coalesced points on
     * supported devices.
     */

    const events =
      event.getCoalescedEvents
        ? event.getCoalescedEvents()
        : [event];


    events.forEach(
      pointerEvent => {

        const point =
          getPoint(
            pointerEvent
          );


        const points =
          stroke.points;


        const previous =
          points[
            points.length - 1
          ];


        points.push(
          point
        );


        const ctx =
          getContext();


        if (!ctx) {
          return;
        }


        /*
         * First segment.
         */

        if (
          points.length === 2
        ) {

          drawSmoothPath(
            ctx,
            [
              previous,
              point
            ],
            stroke
          );

          return;

        }


        /*
         * Smooth quadratic segment.
         */

        const beforePrevious =
          points[
            points.length - 3
          ];

        const currentPrevious =
          points[
            points.length - 2
          ];

        const current =
          points[
            points.length - 1
          ];


        const start =
          midpoint(
            beforePrevious,
            currentPrevious
          );


        const end =
          midpoint(
            currentPrevious,
            current
          );


        drawSmoothPath(
          ctx,
          [
            start,
            currentPrevious,
            end
          ],
          stroke
        );

      }
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
     CHOOSE TOOL
  ========================== */

  function chooseTool(
    selectedTool
  ) {

    setTool(
      selectedTool
    );

  }


  /* =========================
     THICKNESS
  ========================== */

  function changeThickness(
    event
  ) {

    const size =
      Number(
        event.target.value
      );


    setToolSizes(
      current => ({
        ...current,

        [tool]: size,

      })
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


    if (
      tool === "eraser"
    ) {

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
     EXPORT
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
     * Paper.
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
     * Existing drawing.
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
        (pageWidth - size) / 2;


      const y =
        (pageHeight - size) / 2;


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


  const CurrentToolIcon =
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


          {Object.keys(TOOLS).map(
            toolName => {

              const Icon =
                TOOLS[
                  toolName
                ].icon;


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


        {/* =========================
            THICKNESS
        ========================== */}

        <div className="classic-tool-section">

          <div className="classic-control-heading">

            <span className="classic-label">
              THICKNESS
            </span>

            <span className="classic-size-value">
              {thickness}px
            </span>

          </div>


          <input
            type="range"

            min={
              TOOLS[tool].minSize
            }

            max={
              TOOLS[tool].maxSize
            }

            value={
              thickness
            }

            onChange={
              changeThickness
            }

            className="classic-thickness"
          />

        </div>


        {/* =========================
            COLOR
        ========================== */}

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


        {/* =========================
            HISTORY
        ========================== */}

        <div className="classic-tool-section">

          <span className="classic-label">
            HISTORY
          </span>


          <div className="classic-history">

            <button
              type="button"

              className="classic-small-button"

              onClick={
                undo
              }

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

              onClick={
                redo
              }

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


        {/* =========================
            EXPORT
        ========================== */}

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


        {/* =========================
            CURRENT TOOL
        ========================== */}

        <div className="classic-current-tool">

          <CurrentToolIcon
            size={14}
          />

          <span>
            {TOOLS[tool].label}
          </span>

        </div>

      </aside>

    </section>

  );

}


export default ClassicSketch;