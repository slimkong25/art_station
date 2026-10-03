import { useState } from "react";
import ClassicSketch from "./ClassicSketch";
import EtchASketch from "./EtchASketch";
import "./Playground.css";


function Playground() {

  const [mode, setMode] =
    useState("classic");


  return (
    <main className="playground-page">

      {/* =========================
          INTRO
      ========================== */}

      <section className="playground-heading">

        <span>
          PLAYGROUND
        </span>

        <h1>
          Make something.
        </h1>

        <p>
          Two ways to draw.
        </p>

      </section>


      {/* =========================
          MODE SWITCHER
      ========================== */}

      <div className="playground-switcher">

        <button
          type="button"

          className={
            mode === "classic"
              ? "playground-tab active"
              : "playground-tab"
          }

          onClick={() =>
            setMode("classic")
          }
        >
          CLASSIC STUDIO
        </button>


        <button
          type="button"

          className={
            mode === "etch"
              ? "playground-tab active"
              : "playground-tab"
          }

          onClick={() =>
            setMode("etch")
          }
        >
          ETCH A SKETCH
        </button>

      </div>


      {/* =========================
          WORKSPACE
      ========================== */}

      <section className="playground-workspace">

        {mode === "classic" && (
          <ClassicSketch />
        )}


        {mode === "etch" && (
          <EtchASketch />
        )}

      </section>

    </main>
  );
}


export default Playground;