import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Camera as CameraIcon,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Columns2,
  House,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Maximize2,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  brands,
  colorCount,
  defaultSelection,
  getSelection,
  products,
} from "./data/catalog";
import { Catalog, Swatch } from "./components/Catalog";
import { Camera } from "./components/Camera";
import { Comparison } from "./components/Comparison";
import { Dialog } from "./components/Dialog";
import { generateRoofImage } from "./services/geminiService";
import { downloadImage, photoUrl, preparePhoto } from "./utils/fileUtils";
import { deleteDesign, readDesigns, storeDesign } from "./utils/storage";
import type { CustomShingle, Design, Photo, Selection } from "./types";
import "./styles.css";

type ViewMode = "original" | "preview" | "compare";
type Modal = "catalog" | "saved" | "help" | "camera" | "enlarge" | null;
const SAMPLE = "/images/colonial-home.jpg";
const customInitial = { brand: "", style: "", color: "" };

export default function App() {
  const [selection, setSelection] = useState<Selection>(defaultSelection);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [reference, setReference] = useState<Photo | undefined>();
  const [custom, setCustom] = useState<CustomShingle>(customInitial);
  const [customMode, setCustomMode] = useState(false);
  const [result, setResult] = useState<Design | null>(null);
  const [history, setHistory] = useState<Design[]>([]);
  const [saved, setSaved] = useState<Design[]>([]);
  const [mode, setMode] = useState<ViewMode>("original");
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const sampleRef = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const uploadId = useRef(0);
  const { product, color } = getSelection(selection);
  const selectedLabel = customMode
    ? `${custom.brand} ${custom.style} · ${custom.color}`
    : `${product!.brand} ${product!.name} · ${color!.name}`;
  const matches = query.trim()
    ? products
        .flatMap((p) =>
          p.colors
            .filter((c) =>
              query
                .toLowerCase()
                .split(/\s+/)
                .every((t) =>
                  `${p.brand} ${p.name} ${c.name}`.toLowerCase().includes(t),
                ),
            )
            .map((c) => ({ product: p, color: c })),
        )
        .slice(0, 6)
    : [];
  const displayedMaterial = getSelection(result?.selection || selection);
  const displayedCustom = result ? !!result.custom : customMode;
  const isSaved = !!result && saved.some((d) => d.id === result.id);
  const isStale =
    !!result &&
    (result.selection.productId !== selection.productId ||
      result.selection.colorId !== selection.colorId ||
      JSON.stringify(result.custom) !==
        JSON.stringify(customMode ? custom : undefined) ||
      result.reference?.data !== reference?.data);
  const ready =
    !!photo &&
    (!customMode || Object.values(custom).every((v) => v.trim())) &&
    (!!reference || (!customMode && !!color?.swatch));

  useEffect(() => {
    readDesigns()
      .then(setSaved)
      .catch(() =>
        setToast(
          "Saved designs are unavailable in this browser. Downloads still work.",
        ),
      );
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(null));
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  function cancel() {
    requestId.current++;
    controller.current?.abort();
    setBusy(false);
  }
  function choose(next: Selection) {
    setSelection(next);
    setCustomMode(false);
    setReference(undefined);
    setQuery("");
    setError("");
  }
  async function upload(file: File, isReference = false) {
    const id = ++uploadId.current;
    setUploading(true);
    setError("");
    try {
      const p = await preparePhoto(file);
      if (id !== uploadId.current) return;
      if (isReference) setReference(p);
      else {
        cancel();
        setPhoto(p);
        setResult(null);
        setHistory([]);
        setMode("original");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (id === uploadId.current) setUploading(false);
    }
  }
  async function useSample() {
    setError("");
    try {
      const response = await fetch(SAMPLE);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      await upload(
        new File([blob], "Sample colonial home.jpg", { type: "image/jpeg" }),
      );
    } catch {
      setError(
        "The sample home could not be loaded. Please upload your own photo.",
      );
    }
  }
  async function generate() {
    if (!photo || !ready || busy) return;
    setError("");
    setBusy(true);
    const id = ++requestId.current;
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 190_000);
    const snapshot = {
      photo,
      selection,
      reference,
      custom: customMode ? { ...custom } : undefined,
    };
    try {
      const image = await generateRoofImage(snapshot, abort.signal);
      if (id !== requestId.current) return;
      const design: Design = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        original: photo,
        image,
        selection: { ...selection },
        label: selectedLabel,
        reference,
        custom: snapshot.custom,
      };
      setResult(design);
      setHistory((h) => [design, ...h].slice(0, 8));
      setMode("compare");
      setToast("Your roof preview is ready. Slide to see the difference.");
    } catch (e) {
      if (id === requestId.current)
        setError(
          (e as Error).name === "AbortError"
            ? "The preview timed out. Please try again."
            : (e as Error).message,
        );
    } finally {
      clearTimeout(timer);
      if (id === requestId.current) setBusy(false);
    }
  }
  async function save() {
    if (!result || isSaved) return;
    try {
      await storeDesign(result);
      setSaved(await readDesigns());
      setToast("Design saved on this device.");
    } catch {
      setError(
        "This device could not save the design. Download your preview to keep a copy.",
      );
    }
  }
  async function remove(id: string) {
    try {
      await deleteDesign(id);
      setSaved(await readDesigns());
      setToast("Saved design removed.");
    } catch {
      setToast("Could not remove this saved design. Please try again.");
    }
  }
  function restore(d: Design) {
    cancel();
    setPhoto(d.original);
    setResult(d);
    setSelection(d.selection);
    setCustomMode(!!d.custom);
    setCustom(d.custom || customInitial);
    setReference(d.reference);
    setMode("compare");
    setModal(null);
    setError("");
  }
  function reset() {
    cancel();
    uploadId.current++;
    setUploading(false);
    setPhoto(null);
    setResult(null);
    setHistory([]);
    setMode("original");
    setReference(undefined);
    setError("");
    setToast("Ready for a new home.");
  }

  return (
    <>
      <a href="#studio" className="skip-link">
        Skip to roof studio
      </a>
      <header className="site-header">
        <a
          className="brand-lockup"
          href="/"
          aria-label="Shingle Visualizer home"
        >
          <span className="brand-icon">
            <Layers3 size={24} strokeWidth={1.6} />
          </span>
          <span>
            <strong>Shingle Visualizer</strong>
            <small>EXPLORE YOUR NEXT ROOF</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button className="nav-link active" onClick={() => setModal(null)}>
            <Layers3 size={16} /> Visualizer
          </button>
          <button className="nav-link" onClick={() => setModal("catalog")}>
            Shingle library
          </button>
          <button className="nav-link" onClick={() => setModal("saved")}>
            Saved designs{" "}
            {saved.length > 0 && <span className="count">{saved.length}</span>}
          </button>
        </nav>
        <button className="help-button" onClick={() => setModal("help")}>
          <CircleHelp size={18} />
          <span>How it works</span>
        </button>
      </header>
      <main id="studio">
        <section className="intro">
          <div>
            <div className="eyebrow intro-eyebrow">
              <span /> YOUR HOME. REIMAGINED.
            </div>
            <h1>A fresh perspective on your roof.</h1>
            <p>Find the shingle you love. See it on the home you love.</p>
          </div>
          <div className="intro-note">
            <ShieldCheck size={21} />
            <span>
              Real shingle references.
              <br />
              <strong>More confident decisions.</strong>
            </span>
          </div>
        </section>
        <div className="workflow" aria-label="Design progress">
          <div className={photo ? "complete" : "current"}>
            <span className="step-number">
              {photo ? <Check size={14} /> : "01"}
            </span>
            <span>
              Add your home<small>A photo is all you need</small>
            </span>
          </div>
          <span className="step-line" />
          <div className={photo ? "current" : ""}>
            <span className="step-number">02</span>
            <span>
              Find your shingle<small>Explore the possibilities</small>
            </span>
          </div>
          <span className="step-line" />
          <div className={result ? "complete" : ""}>
            <span className="step-number">
              {result ? <Check size={14} /> : "03"}
            </span>
            <span>
              See the transformation<small>Compare, save, and share</small>
            </span>
          </div>
        </div>
        <div className="workspace">
          <aside className="config-panel" aria-label="Roof design controls">
            <section className="photo-section">
              <div className="section-heading">
                <h2>
                  <span>01</span> Your home
                </h2>
                {photo && (
                  <button
                    className="text-button"
                    disabled={busy || uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    Change photo
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                className="visually-hidden"
                tabIndex={-1}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
              {photo ? (
                <div className="photo-loaded">
                  <img src={photoUrl(photo)} alt="Your uploaded home" />
                  <div>
                    <strong>{photo.name}</strong>
                    <small>
                      <CheckCheck size={13} /> Ready for a new look
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Remove home photo"
                    disabled={busy}
                    onClick={reset}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f && !busy) void upload(f);
                  }}
                >
                  <button
                    disabled={uploading}
                    className="upload-main"
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? (
                      <LoaderCircle className="spin" size={23} />
                    ) : (
                      <ImagePlus size={23} />
                    )}
                    <span>
                      <strong>Upload a home photo</strong>
                      <small>or drag & drop it here</small>
                    </span>
                    <Plus size={17} />
                  </button>
                  <div className="upload-bottom">
                    <span>JPG, PNG, WebP · Up to 12 MB</span>
                    <button onClick={() => setModal("camera")}>
                      <CameraIcon size={13} /> Camera
                    </button>
                  </div>
                </div>
              )}
            </section>
            <section className="shingle-section">
              <div className="section-heading">
                <h2>
                  <span>02</span> Your shingle
                </h2>
                <button
                  className="text-button"
                  onClick={() => setModal("catalog")}
                  disabled={busy}
                >
                  Browse all <ArrowUpRight size={13} />
                </button>
              </div>
              <fieldset
                disabled={busy || uploading}
                className="control-fieldset"
              >
                <div className="quick-search">
                  <label className="search-field">
                    <Search size={15} />
                    <input
                      aria-label="Find a shingle by name"
                      placeholder="Know your shingle? Search here"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        aria-label="Clear shingle search"
                        onClick={() => setQuery("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  {query.trim() && (
                    <div className="search-results">
                      {matches.length ? (
                        matches.map(({ product: p, color: c }) => (
                          <button
                            key={p.id + c.id}
                            onClick={() =>
                              choose({ productId: p.id, colorId: c.id })
                            }
                          >
                            <Swatch color={c} />
                            <span>
                              <strong>{c.name}</strong>
                              <small>
                                {p.brand} · {p.name}
                              </small>
                            </span>
                            <ArrowRight size={14} />
                          </button>
                        ))
                      ) : (
                        <p>
                          No match yet. Try another name, or add a custom
                          shingle below.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="mode-switch">
                  <button
                    aria-pressed={!customMode}
                    className={!customMode ? "active" : ""}
                    onClick={() => {
                      setCustomMode(false);
                      setReference(undefined);
                    }}
                  >
                    From the library
                  </button>
                  <button
                    aria-pressed={customMode}
                    className={customMode ? "active" : ""}
                    onClick={() => {
                      setCustomMode(true);
                      setReference(undefined);
                    }}
                  >
                    Custom shingle
                  </button>
                </div>
                {customMode ? (
                  <div className="custom-fields">
                    {(["brand", "style", "color"] as const).map((k) => (
                      <label key={k}>
                        {k === "style"
                          ? "Product line / style"
                          : k === "brand"
                            ? "Manufacturer"
                            : "Color name"}
                        <input
                          maxLength={100}
                          value={custom[k]}
                          placeholder={
                            k === "brand"
                              ? "e.g. GAF"
                              : k === "style"
                                ? "e.g. Grand Sequoia"
                                : "e.g. Charcoal"
                          }
                          onChange={(e) =>
                            setCustom({ ...custom, [k]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="select-row">
                      <label>
                        Brand
                        <div className="select-wrap">
                          <select
                            aria-label="Brand"
                            value={product!.brand}
                            onChange={(e) => {
                              const p = products.find(
                                (p) => p.brand === e.target.value,
                              )!;
                              choose({
                                productId: p.id,
                                colorId: p.colors[0].id,
                              });
                            }}
                          >
                            {brands.map((b) => (
                              <option key={b}>{b}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </label>
                      <label>
                        Shingle style
                        <div className="select-wrap">
                          <select
                            aria-label="Shingle style"
                            value={product!.id}
                            onChange={(e) => {
                              const p = products.find(
                                (p) => p.id === e.target.value,
                              )!;
                              choose({
                                productId: p.id,
                                colorId: p.colors[0].id,
                              });
                            }}
                          >
                            {products
                              .filter((p) => p.brand === product!.brand)
                              .map((p) => (
                                <option value={p.id} key={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </label>
                    </div>
                    <div className="color-heading">
                      <label>Choose your color</label>
                      <span>{product!.colors.length} colors</span>
                    </div>
                    <div className="color-grid">
                      {product!.colors.map((c) => (
                        <button
                          key={c.id}
                          className={`color-option ${c.id === color!.id ? "selected" : ""}`}
                          aria-label={c.name}
                          aria-pressed={c.id === color!.id}
                          onClick={() => {
                            setSelection({ ...selection, colorId: c.id });
                            setReference(undefined);
                          }}
                        >
                          <div className="color-photo">
                            <Swatch color={c} />
                            {c.id === color!.id && (
                              <span className="color-check">
                                <Check size={12} />
                              </span>
                            )}
                          </div>
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {(customMode || !color!.swatch) && (
                  <div className="reference-upload">
                    <label>
                      Shingle reference photo <span>Required</span>
                    </label>
                    <p>
                      Show us the actual material for a more faithful match.
                    </p>
                    <input
                      ref={sampleRef}
                      className="visually-hidden"
                      tabIndex={-1}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f, true);
                        e.target.value = "";
                      }}
                    />
                    <button
                      className="secondary full"
                      onClick={() => sampleRef.current?.click()}
                    >
                      <Upload size={15} />
                      {reference
                        ? "Change reference photo"
                        : "Add a shingle sample"}
                    </button>
                    {reference && (
                      <div className="reference-loaded">
                        <img
                          src={photoUrl(reference)}
                          alt="Uploaded shingle reference"
                        />
                        <span>{reference.name}</span>
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                )}
              </fieldset>
              {!customMode && (
                <a
                  className="product-source"
                  href={product!.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ShieldCheck size={13} />
                  {color!.swatch
                    ? "Manufacturer swatch reference"
                    : "Verified product names · add a sample"}
                  <ArrowUpRight size={13} />
                </a>
              )}
            </section>
            <div className="generate-section">
              {error && (
                <div className="error-box" role="alert">
                  <p>{error}</p>
                  <button
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <button
                className="primary generate-button"
                disabled={!ready || busy || uploading}
                onClick={() => void generate()}
              >
                {busy ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                <span>
                  {busy
                    ? "Creating your new look…"
                    : result
                      ? "Generate another look"
                      : "Visualize my roof"}
                </span>
                {!busy && <ArrowRight size={18} />}
              </button>
              <p>
                {!photo
                  ? "Add your home photo to get started"
                  : !ready
                    ? "Add a shingle reference to continue"
                    : "Your photo + real materials + a little possibility"}
              </p>
            </div>
          </aside>
          <section className="preview-panel" aria-label="Home visualization">
            <div className="preview-toolbar">
              <div>
                <span className={`status-dot ${photo ? "ready" : ""}`} />
                <strong>{photo ? "Your home" : "A little inspiration"}</strong>
                <span className="toolbar-divider" />
                <span className="toolbar-label">
                  {photo ? "Design workspace" : "Start with a possibility"}
                </span>
              </div>
              <div className="preview-tools">
                <button
                  className="icon-button"
                  onClick={reset}
                  disabled={!photo || busy}
                  aria-label="Start a new home"
                  title="Start a new home"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => setModal("enlarge")}
                  aria-label="Enlarge preview"
                  title="Enlarge preview"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
            <div className={`preview-stage ${!photo ? "inspiration" : ""}`}>
              <Comparison
                original={photo ? photoUrl(photo) : SAMPLE}
                generated={result?.image}
                mode={mode}
              />
              {!result && (
                <div className="photo-badge">
                  <span />
                  {photo ? "ORIGINAL PHOTO" : "SAMPLE HOME"}
                </div>
              )}
              {!photo && (
                <div className="inspiration-overlay">
                  <span className="eyebrow">
                    GOOD DESIGN STARTS AT THE TOP.
                  </span>
                  <h2>
                    Your home.
                    <br />A whole new feeling.
                  </h2>
                  <button
                    className="sample-button"
                    onClick={() => void useSample()}
                    disabled={uploading}
                  >
                    Try this home <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {busy && (
                <div className="generating-overlay" role="status">
                  <div className="generating-icon">
                    <Sparkles size={29} />
                  </div>
                  <h3>
                    {elapsed < 15
                      ? "Getting to know your roof"
                      : elapsed < 45
                        ? "Laying down your new look"
                        : "Working on the finishing touches"}
                  </h3>
                  <p>Matching the material, light, and perspective.</p>
                  <span>{elapsed}s elapsed · Usually takes 30–90 seconds</span>
                  <button className="secondary" onClick={cancel}>
                    Cancel preview
                  </button>
                </div>
              )}
            </div>
            <div className="preview-bottom">
              {result ? (
                <>
                  <div
                    className="view-switch"
                    role="group"
                    aria-label="Preview display mode"
                  >
                    {(["original", "preview", "compare"] as ViewMode[]).map(
                      (v) => (
                        <button
                          key={v}
                          className={mode === v ? "active" : ""}
                          aria-pressed={mode === v}
                          onClick={() => setMode(v)}
                        >
                          {v === "compare" && <Columns2 size={14} />}{" "}
                          {v === "original"
                            ? "Original"
                            : v === "preview"
                              ? "New roof"
                              : "Compare"}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="result-actions">
                    <button
                      className="icon-button"
                      onClick={() => void save()}
                      disabled={isSaved}
                      aria-label={isSaved ? "Design saved" : "Save design"}
                      title={isSaved ? "Saved" : "Save design"}
                    >
                      {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => downloadImage(result.image, result.label)}
                    >
                      <ArrowDownToLine size={15} />
                      <span>Download</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="preview-caption">
                    <House size={16} />
                    <span>
                      {photo
                        ? "Your canvas is ready. Let’s make it yours."
                        : "Your next chapter starts with a single photo."}
                    </span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy || uploading}
                  >
                    {photo ? "Change photo" : "Use my home"}
                    <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>
            <div className="material-card">
              {!displayedCustom && displayedMaterial.color && (
                <Swatch color={displayedMaterial.color} />
              )}
              <div className="material-description">
                <span className="eyebrow">
                  {result ? "PREVIEW MATERIAL" : "YOUR SELECTED LOOK"}
                </span>
                <h3>{result ? result.label : selectedLabel}</h3>
                <p>
                  {isStale
                    ? "Your selection has changed. Generate a new preview to apply it."
                    : displayedCustom
                      ? "A custom material, guided by your reference photo."
                      : displayedMaterial.product!.description}
                </p>
              </div>
              <span className="material-tag">
                {displayedCustom ? "Custom" : displayedMaterial.product!.style}
              </span>
            </div>
            {history.length > 1 && (
              <div className="history-strip">
                <span>Recent looks</span>
                {history.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => restore(d)}
                    aria-label={`View ${d.label}`}
                    className={result?.id === d.id ? "active" : ""}
                  >
                    <img src={d.image} alt={d.label} />
                  </button>
                ))}
              </div>
            )}
            <p className="preview-disclaimer">
              <CircleHelp size={13} />{" "}
              {result
                ? "AI-generated concept. Review roof details and confirm color with a physical sample."
                : "Preview colors in context. Lighting, screens, and materials can affect the final appearance."}
            </p>
          </section>
        </div>
        <section className="trust-strip">
          <div>
            <Layers3 size={22} />
            <span>
              <strong>Real materials, real possibilities</strong>
              <small>
                {brands.length} trusted brands. {colorCount} curated colors.
              </small>
            </span>
          </div>
          <div>
            <House size={22} />
            <span>
              <strong>Made for your home</strong>
              <small>Your architecture. Your perspective.</small>
            </span>
          </div>
          <div>
            <Bookmark size={22} />
            <span>
              <strong>Find it. Compare it. Keep it.</strong>
              <small>Save your favorites and share a download.</small>
            </span>
          </div>
        </section>
        <footer className="site-footer">
          <span>Shingle Visualizer · A new perspective on your home.</span>
          <div>
            <span
              className={`connection-dot ${configured ? "connected" : ""}`}
            />
            {configured
              ? "Image studio connected"
              : configured === false
                ? "Explore mode · image service setup needed"
                : "Checking image service"}
            <button onClick={() => setModal("help")}>About this studio</button>
          </div>
        </footer>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal === "catalog" && (
        <Catalog
          selection={selection}
          onSelect={choose}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "camera" && (
        <Camera
          onCapture={(file) => void upload(file)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "enlarge" && (
        <Dialog
          title={result ? result.label : "Your home, a little closer"}
          onClose={() => setModal(null)}
          wide
        >
          <div className="enlarged-image">
            <Comparison
              original={photo ? photoUrl(photo) : SAMPLE}
              generated={result?.image}
              mode={mode}
            />
          </div>
          {result && (
            <button
              className="primary"
              onClick={() => downloadImage(result.image, result.label)}
            >
              <ArrowDownToLine size={16} />
              Download preview
            </button>
          )}
        </Dialog>
      )}
      {modal === "saved" && (
        <Dialog title="Your saved designs" onClose={() => setModal(null)} wide>
          <p className="muted">
            A shortlist for your next chapter. Saved privately in this browser,
            on this device.
          </p>
          {saved.length ? (
            <div className="saved-grid">
              {saved.map((d) => (
                <article key={d.id} className="saved-card">
                  <button className="saved-image" onClick={() => restore(d)}>
                    <img src={d.image} alt={d.label} />
                  </button>
                  <h3>{d.label}</h3>
                  <small>
                    {new Date(d.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </small>
                  <div>
                    <button className="text-button" onClick={() => restore(d)}>
                      Open design <ArrowRight size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => downloadImage(d.image, d.label)}
                      aria-label={`Download ${d.label}`}
                    >
                      <ArrowDownToLine size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => void remove(d.id)}
                      aria-label={`Delete ${d.label}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Bookmark size={35} />
              <h3>Your favorites belong here.</h3>
              <p>Generate a roof preview, then tap the bookmark to keep it.</p>
              <button className="primary" onClick={() => setModal(null)}>
                Create your first look <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Dialog>
      )}
      {modal === "help" && (
        <Dialog
          title="A new roof in three simple steps"
          onClose={() => setModal(null)}
        >
          <div className="help-steps">
            <article>
              <span>01</span>
              <div>
                <h3>Give us a good view</h3>
                <p>
                  Upload or take a bright, sharp photo with the whole roof
                  visible. Avoid trees blocking the roof. JPG, PNG, and WebP
                  files up to 12 MB work best.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Make it your own</h3>
                <p>
                  Choose a brand, style, and color. Manufacturer swatches guide
                  the image. For an unlisted product or a color without a
                  swatch, add your own reference photo.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>See the possibilities</h3>
                <p>
                  Generate a preview, slide between before and after, and save
                  your favorites. Download an image to share with your family or
                  roofer.
                </p>
              </div>
            </article>
          </div>
          <div className="help-note">
            <ShieldCheck size={19} />
            <p>
              AI previews are design concepts, not exact color or installation
              guarantees. Always confirm materials with a physical sample and
              local supplier. Your photo is sent to Google’s image service only
              when you generate; saved designs stay in this browser.
            </p>
          </div>
          {configured === false && (
            <div className="setup-note">
              <h3>Connect image generation</h3>
              <p>
                The studio owner needs to add a Gemini API key as{" "}
                <code>GEMINI_API_KEY</code> in the server’s{" "}
                <code>.env.local</code> file, then restart the app. A model with
                image-generation access is required.
              </p>
            </div>
          )}
          <p className="fine-print">
            Sample home photography:{" "}
            <a
              href="https://www.certainteed.com/products/residential-roofing-products/landmark"
              target="_blank"
              rel="noreferrer"
            >
              CertainTeed Landmark
            </a>
            . Manufacturer names and swatches are used for product
            identification; no affiliation is implied. Catalog researched
            September 19, 2026. Regional availability varies.
          </p>
        </Dialog>
      )}
    </>
  );
}
