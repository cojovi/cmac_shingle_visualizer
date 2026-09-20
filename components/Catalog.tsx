import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Search } from "lucide-react";
import { brands, products } from "../data/catalog";
import { Dialog } from "./Dialog";
import type { Selection, ShingleColor } from "../types";
export function Swatch({
  color,
  className = "",
}: {
  color: ShingleColor;
  className?: string;
}) {
  return color.swatch ? (
    <img
      className={`swatch-image ${className}`}
      src={color.swatch}
      alt={`${color.name} manufacturer shingle swatch`}
      loading="lazy"
    />
  ) : (
    <span className={`swatch-missing ${className}`}>
      <span>
        Sample
        <br />
        needed
      </span>
    </span>
  );
}
export function Catalog({
  selection,
  onSelect,
  onClose,
}: {
  selection: Selection;
  onSelect: (s: Selection) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All brands");
  const groups = useMemo(
    () =>
      products
        .filter((p) => brand === "All brands" || p.brand === brand)
        .map((p) => ({
          ...p,
          colors: p.colors.filter((c) =>
            `${p.brand} ${p.name} ${c.name} ${p.style}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
        }))
        .filter((p) => p.colors.length),
    [query, brand],
  );
  return (
    <Dialog title="Find your perfect shingle" onClose={onClose} wide>
      <p className="muted">
        Real collections. Manufacturer color references. A look for every home.
      </p>
      <div className="catalog-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Search brand, style, or color…"
            aria-label="Search shingle library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by manufacturer"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          {["All brands", ...brands].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="catalog-results">
        {groups.length === 0 ? (
          <div className="empty-state">
            <Search />
            <h3>No matching shingles</h3>
            <p>
              Try another color or brand, or add a custom shingle in the studio.
            </p>
            <button
              className="secondary"
              onClick={() => {
                setQuery("");
                setBrand("All brands");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          groups.map((p) => (
            <section className="catalog-group" key={p.id}>
              <div className="catalog-group-heading">
                <div>
                  <span className="eyebrow">
                    {p.brand} · {p.style}
                  </span>
                  <h3>{p.name}</h3>
                </div>
                <a href={p.source} target="_blank" rel="noreferrer">
                  Manufacturer <ArrowUpRight size={14} />
                </a>
              </div>
              <div className="catalog-grid">
                {p.colors.map((c) => (
                  <button
                    className={`library-color ${selection.productId === p.id && selection.colorId === c.id ? "selected" : ""}`}
                    key={c.id}
                    aria-label={`${p.brand} ${p.name} ${c.name}`}
                    onClick={() => {
                      onSelect({ productId: p.id, colorId: c.id });
                      onClose();
                    }}
                  >
                    <Swatch color={c} />
                    <span>{c.name}</span>
                    {selection.productId === p.id &&
                      selection.colorId === c.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <p className="fine-print">
        Product and color availability varies by region. Digital previews are an
        approximation; confirm with full-size physical samples. Manufacturer
        names and images belong to their respective owners.
      </p>
    </Dialog>
  );
}
