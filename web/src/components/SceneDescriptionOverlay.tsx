import { useEffect, useRef, useState } from "react";

interface SceneDescriptionOverlayProps {
  text: string | null;
}

const TYPING_INTERVAL_MS = 33; // Approximately 30 intervals per second
const CHARACTERS_PER_INTERVAL = 8;

const SceneDescriptionOverlay = ({ text }: SceneDescriptionOverlayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setDisplayedText("");

    if (!text) {
      return undefined;
    }

    let index = 0;

    const typeNext = () => {
      setDisplayedText(text.slice(0, index + CHARACTERS_PER_INTERVAL));
      index += CHARACTERS_PER_INTERVAL;

      if (index < text.length) {
        timeoutRef.current = window.setTimeout(typeNext, TYPING_INTERVAL_MS);
      }
    };

    timeoutRef.current = window.setTimeout(typeNext, TYPING_INTERVAL_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  if (!text) {
    return null;
  }

  return (
    <div className="sceneDescriptionOverlay" aria-live="polite">
      <p className="sceneDescriptionOverlayText">{displayedText}</p>
    </div>
  );
};

export default SceneDescriptionOverlay;
