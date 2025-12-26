import { useEffect, useMemo, useRef, useState } from "react";
import SceneView from "./components/SceneView";
import "./App.css";

const App = () => {

  return (
    <>
      <div className="appStack">
        <main className="appShell">
          <section className="panel panel--flush" aria-label="Scene view">
            <SceneView
              
            />
          </section>
        </main>
      </div>
    </>
  );
};

export default App;
