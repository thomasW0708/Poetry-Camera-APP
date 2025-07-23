import React, { useState, useEffect, useRef } from "react";
import {
  History,
  Settings,
  Image as ImageIcon,
  Camera,
  Flashlight,
  FlashlightOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Poetry Camera App
 * -----------------
 * A mobile‑style React application that lets users "take" a photo and generates
 * a poem for each shot. Three main screens:
 *   • Camera (default viewfinder UI)
 *   • History (list of generated poems / shots)
 *   • Settings (choose poem type & model temperature)
 *
 * Tech Stack
 * ----------
 * • React 18
 * • Tailwind CSS for layout & styling
 * • lucide‑react icon set
 * • framer‑motion for page transitions
 */
export default function App() {
  const [screen, setScreen] = useState("camera");
  const [flashOn, setFlashOn] = useState(false);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[360px] h-[640px] rounded-2xl shadow-2xl overflow-hidden relative">
        <CardContent className="p-0 w-full h-full">
          <AnimatePresence mode="wait" initial={false}>
            {screen === "camera" && (
              <CameraScreen
                key="camera"
                onHistory={() => setScreen("history")}
                onSettings={() => setScreen("settings")}
                flashOn={flashOn}
                toggleFlash={() => setFlashOn((v) => !v)}
              />
            )}
            {screen === "history" && (
              <HistoryScreen key="history" onBack={() => setScreen("camera")} />
            )}
            {screen === "settings" && (
              <SettingsScreen key="settings" onBack={() => setScreen("camera")} />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Animation helpers                                                          */
/* -------------------------------------------------------------------------- */
const slideFade = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

/* -------------------------------------------------------------------------- */
/* Camera Screen                                                              */
/* -------------------------------------------------------------------------- */
function CameraScreen({ onHistory, onSettings, flashOn, toggleFlash }) {
  return (
    <motion.div
      {...slideFade}
      className="w-full h-full flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onHistory}>
          <History className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings}>
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Viewfinder placeholder */}
      <div className="flex-1 mx-4 mb-4 bg-gray-200 rounded-xl flex items-center justify-center">
        <Camera className="w-20 h-20 text-gray-400" />
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-around pb-6">
        <Button variant="ghost" size="icon">
          <ImageIcon className="w-8 h-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="border-4 border-gray-800 rounded-full w-20 h-20 hover:scale-105 transition"
        >
          <span className="sr-only">Shutter</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleFlash}>
          {flashOn ? (
            <Flashlight className="w-8 h-8" />
          ) : (
            <FlashlightOff className="w-8 h-8" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* History Screen                                                             */
/* -------------------------------------------------------------------------- */
function HistoryScreen({ onBack }) {
  /** Dummy shots. In a real implementation these would be replaced with state
   *  persisted on‑device or remotely. */
  const initialShots = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }));

  const [shots, setShots] = useState(initialShots);
  const [pending, setPending] = useState(null); // { id, secondsLeft }

  /* Long‑press delete with 5‑second undo window --------------------------- */
  const handleLongPressDelete = (id) => {
    if (pending) return; // only one undoable deletion at a time
    setShots((s) => s.filter((shot) => shot.id !== id));
    setPending({ id, secondsLeft: 5 });
  };

  // Countdown effect
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => {
      setPending((p) => {
        if (!p) return null;
        if (p.secondsLeft <= 1) {
          clearInterval(interval);
          return null; // finalize delete
        }
        return { ...p, secondsLeft: p.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const undoDelete = () => {
    if (!pending) return;
    setShots((s) => [...s, { id: pending.id }].sort((a, b) => a.id - b.id));
    setPending(null);
  };

  return (
    <motion.div {...slideFade} className="w-full h-full flex flex-col">
      <div className="p-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-6">
        {/* Active shots */}
        {shots.map((shot) => (
          <ShotItem key={shot.id} id={shot.id} onLongPress={handleLongPressDelete} />
        ))}

        {/* Undo placeholder */}
        {pending && (
          <div className="w-full h-20 bg-red-100 rounded-xl flex items-center justify-center">
            <button onClick={undoDelete} className="relative focus:outline-none">
              {/* Circle countdown */}
              <svg className="w-12 h-12" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke="#ef4444"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset={((5 - pending.secondsLeft) / 5) * 100}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-red-600">
                Undo {pending.secondsLeft}
              </span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Single history item with 3‑second long‑press detection */
function ShotItem({ id, onLongPress }) {
  const timerRef = useRef(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => onLongPress(id), 3000);
  };
  const endPress = () => timerRef.current && clearTimeout(timerRef.current);

  return (
    <div
      className="w-full h-20 bg-gray-200 rounded-xl"
      onMouseDown={startPress}
      onTouchStart={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchEnd={endPress}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Settings Screen                                                            */
/* -------------------------------------------------------------------------- */
function SettingsScreen({ onBack }) {
  const [selectedPoemType, setSelectedPoemType] = useState("Haiku");
  const [temperature, setTemperature] = useState(0.7);

  const poemTypes = ["Haiku", "Sonnet", "Limerick", "Free Verse", "Acrostic"];

  return (
    <motion.div {...slideFade} className="w-full h-full flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-6">
        {/* Poem Type Picker */}
        <div className="bg-gray-100 rounded-xl px-4 py-3">
          <h3 className="font-medium mb-3">Poem Type</h3>
          <div className="space-y-2">
            {poemTypes.map((type) => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="poemType"
                  value={type}
                  checked={selectedPoemType === type}
                  onChange={(e) => setSelectedPoemType(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Model Temperature Slider (0 – 2) */}
        <div className="bg-gray-100 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Model Temperature</h3>
            <span className="text-sm text-gray-600">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.00</span>
            <span>1.00</span>
            <span>2.00</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Basic Jest + React‑Testing‑Library sanity checks                           */
/* -------------------------------------------------------------------------- */
/*
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("renders Camera screen by default", () => {
  render(<App />);
  expect(screen.getByLabelText(/Shutter/i)).toBeInTheDocument();
});

test("navigates to Settings and slider max is 2", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /settings/i }));
  const slider = screen.getByRole("slider");
  expect(slider).toHaveAttribute("max", "2");
});
*/
