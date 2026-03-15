"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Category {
  id: string;
  name: string;
}

export default function ScanPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", description: "", categoryId: "", date: "" });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setProcessing(true);
    setOcrText("");
    setSaved(false);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar la imagen");
        return;
      }

      setOcrText(data.ocrText || "");
      setImageUrl(data.imageUrl || null);

      const catMatch = categories.find((c) => c.name === data.category);

      setForm({
        amount: data.amount ? String(data.amount) : "",
        description: data.description || "Recibo escaneado",
        categoryId: catMatch?.id || "",
        date: data.date || new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
      setError("Fallo en la conexión al servidor inteligente");
    } finally {
      setProcessing(false);
    }
  }, [categories]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ocrText, receipt: imageUrl }),
        });
        if (res.ok) {
          setSaved(true);
          setForm({ amount: "", description: "", categoryId: "", date: "" });
          setOcrText("");
          setPreview(null);
          setImageUrl(null);
        }
      } finally {
        setSaving(false);
      }
    }, 500);
  }

  return (
    <div className="min-h-[85vh] @container pb-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2 transition-all">
          Escáner Inteligente
        </h1>
        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
          Digitaliza, extrae y guarda tus recibos usando IA. Todos los campos son adaptativos y editables.
        </p>
      </header>

      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Uploader */}
        <div className="@4xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-1 md:p-2 rounded-3xl shadow-sm transition-all duration-300 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              className={`relative flex flex-col items-center justify-center p-8 md:p-14 border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${
                dragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[0.98]"
                  : preview 
                  ? "border-transparent bg-transparent"
                  : "border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-gray-800"
              }`}
            >
              {preview ? (
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 group-hover:shadow-indigo-500/10">
                  <img src={preview} alt="Vista Previa" className="w-full h-auto max-h-[400px] object-cover md:object-contain bg-gray-100 dark:bg-gray-950" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full font-medium text-sm transition-transform active:scale-95 shadow-xl">
                      Cambiar
                    </button>
                    <button onClick={() => { setPreview(null); setOcrText(""); setForm({ amount: "", description: "", categoryId: "", date: "" }); }} className="px-5 py-2.5 bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md rounded-full font-medium text-sm transition-transform active:scale-95 shadow-xl">
                      Descartar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 mb-2 ring-1 ring-inset ring-indigo-500/20">
                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subir Documento</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mx-auto leading-relaxed">
                    Sube una foto o PDF del recibo, captura con cámara o arrastra y suelta aquí.
                  </p>
                  
                  <div className="pt-4 flex flex-col @xs:flex-row items-center justify-center gap-3 w-full">
                    {/* Al omitir capture="environment" iOS da opción a Archivos o Fototeca.
                        Pero agregamos un segundo input explícito para Cámara directa para mejor UX */}
                    <button onClick={() => cameraRef.current?.click()} className="w-full @xs:w-auto px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                       Cámara
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="w-full @xs:w-auto px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                       Archivos
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Ocultos. Solo se aceptan JPEG, PNG y WEBP para garantizar compatibilidad visual con la API y navegador */}
            <input ref={fileRef} type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFile} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/jpeg, image/png, image/webp" capture="environment" onChange={handleFile} className="hidden" />

            {/* Loader Premium */}
            {processing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl z-10 transition-all">
                 <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full"></div>
                    <div className="absolute w-16 h-16 border-4 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
                 </div>
                 <h4 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">Procesando con IA Vision</h4>
                 <p className="text-sm text-gray-500 animate-pulse mt-1">Extraccción de texto en curso...</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
        </div>

        {/* Panel Derecho: Datos Editables y Formulario */}
        {ocrText !== "" && !processing && (
          <div className="@4xl:col-span-7 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            
            {/* Formulario Estético */}
            <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Detalles del Gasto</h2>
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                   IA Asistido
                 </span>
              </div>

              {saved ? (
                <div className="flex flex-col items-center justify-center p-10 bg-green-50 dark:bg-green-500/10 rounded-2xl text-center border dashed border-green-200 dark:border-green-500/20">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400">¡Gasto Guardado!</h3>
                  <p className="text-green-600/80 dark:text-green-400/80 mt-2 text-sm max-w-xs">El documento y los datos se han sincronizado correctamente en tu cuenta.</p>
                  <button type="button" onClick={() => { setSaved(false); setPreview(null); }} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full font-medium shadow-md hover:bg-green-700 active:scale-95 transition-all">Escanear otro documento</button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-5">
                    {/* Monto */}
                    <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Monto Extraído</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">S/</span>
                        <input
                          type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                    {/* Fecha */}
                    <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha del Documento</label>
                      <input
                        type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Concepto / Descripción</label>
                    <input
                      type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Categoria */}
                  <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Categoría</label>
                    <select
                      value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none appearance-none"
                      required
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Texto Original Extraido Editabe */}
                  <div className="space-y-1.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-400">
                      <span>Texto en bruto extraído (Editable)</span>
                      <span className="text-xs font-normal text-gray-400">Corrige si la IA erró</span>
                    </label>
                    <textarea 
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs md:text-sm text-gray-600 dark:text-gray-400 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-y"
                    />
                  </div>

                  <button type="submit" disabled={saving} className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl disabled:opacity-70 disabled:scale-100 transition-all active:scale-[0.98]">
                    {saving ? (
                      <>
                        <svg className="w-5 h-5 animate-spin text-white/50" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Guardar Transacción
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
