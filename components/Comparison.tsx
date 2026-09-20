import { useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
export function Comparison({
  original,
  generated,
  mode,
}: {
  original: string;
  generated?: string;
  mode: "original" | "preview" | "compare";
}) {
  const [position, setPosition] = useState(50);
  return (
    <div className="comparison">
      <img
        className="house-image"
        src={mode === "original" || !generated ? original : generated}
        alt={
          mode === "original" || !generated
            ? "Original home photograph"
            : "Home with the selected shingle visualization"
        }
      />
      {mode === "compare" && generated && (
        <>
          <img
            className="house-image compare-original"
            src={original}
            alt="Original roof for comparison"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          />
          <span className="comparison-label before-label">Before</span>
          <span className="comparison-label after-label">After</span>
          <div className="comparison-line" style={{ left: `${position}%` }}>
            <span>
              <ChevronsLeftRight size={22} />
            </span>
          </div>
          <input
            className="comparison-range"
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            aria-label="Before and after comparison position"
            aria-valuetext={`${position}% original photo`}
          />
        </>
      )}
    </div>
  );
}
