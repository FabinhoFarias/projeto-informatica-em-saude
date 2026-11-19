import Image from "next/image";
import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OperationalSection } from "./shared";

export function AttachmentPanel({ propertyId }: { propertyId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"LOCAL" | "ENVIADO">("LOCAL");
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <OperationalSection
      title="Evidências e anexos"
      description="A foto é opcional e não impede o salvamento da ficha básica."
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-emerald-600 hover:bg-emerald-50/40">
            <Camera className="h-6 w-6 text-emerald-800" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold text-slate-800">
              Tirar foto do imóvel
            </span>
            <span className="mt-1 text-xs text-slate-500">
              A câmera será aberta no celular · demonstração local
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setStatus("LOCAL");
              }}
            />
          </label>
          {file && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700">{file.name}</span>
              <span
                className={`px-2 py-1 font-semibold ${status === "ENVIADO" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
              >
                {status === "ENVIADO"
                  ? "Envio fictício concluído"
                  : "Somente no aparelho"}
              </span>
            </div>
          )}
          {file && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("ENVIADO")}
                className="min-h-10 bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Simular envio
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="min-h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Remover
              </button>
            </div>
          )}
        </div>
        <div className="relative min-h-40 overflow-hidden border border-slate-200 bg-slate-100">
          {preview ? (
            <Image
              src={preview}
              alt={`Pré-visualização do anexo do imóvel ${propertyId}`}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-slate-500">
              A pré-visualização aparecerá aqui.
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Não fotografe moradores como comprovação padrão da visita. Anexo
        fictício vinculado somente a esta tela.
      </p>
    </OperationalSection>
  );
}
