"use client";

import {
  Check,
  Clipboard,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Signature = {
  id: number;
  nome: string;
  cargo: string;
  telefone1: string;
  telefone2: string | null;
  imagem: string;
  imagemArquivo: string | null;
  imagemPath: string | null;
};

type FormState = {
  nome: string;
  cargo: string;
  telefone1: string;
  telefone2: string;
  imagem: string;
  imagemArquivo: string;
  imagemPath: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const SFTP_BASE_URL = (process.env.NEXT_PUBLIC_SFTP_BASE_URL || "https://assinaturas.nerus.com.br").replace(/\/+$/, "");
const DEFAULT_PHONE = "(31) 3273-4415";
const BACKGROUND_URL = `${SFTP_BASE_URL}/fundo.png`;
const HEADER_LOGO_URL = `${SFTP_BASE_URL}/nerus_logo.jpeg`;
const SIGNATURE_LOGO_URL = `${SFTP_BASE_URL}/logo2.png`;

const emptyForm: FormState = {
  nome: "",
  cargo: "",
  telefone1: "",
  telefone2: DEFAULT_PHONE,
  imagem: "",
  imagemArquivo: "",
  imagemPath: "",
};

function buildSignatureHtml(signature: Signature) {
  const phoneOne = signature.telefone1?.trim();
  const phoneTwo = signature.telefone2?.trim() || DEFAULT_PHONE;
  const phones = [phoneOne, phoneTwo].filter(Boolean).join(" | ");

  return `<table cellpadding="0" cellspacing="0" role="presentation" style="width: 520px; max-width: 520px; font-family: Arial, sans-serif; color: #1f2937; background-image: url('${BACKGROUND_URL}'); background-size: cover; background-position: center; background-repeat: no-repeat;">
  <tr>
    <td style="padding: 14px 18px 14px 18px; vertical-align: middle;">
      <img src="${signature.imagem}" alt="${signature.nome}" width="132" height="132" style="display: block; width: 132px; height: 132px; border: 3px solid #c1121f; border-radius: 50%; object-fit: cover;" />
    </td>
    <td style="width: 2px; background: #c1121f; font-size: 0; line-height: 0;">&nbsp;</td>
    <td style="padding: 14px 18px 14px 16px; vertical-align: middle;">
      <div style="font-size: 24px; line-height: 26px; font-weight: 700; color: #c1121f; margin: 0 0 4px;">${signature.nome}</div>
      <div style="font-size: 15px; line-height: 18px; font-weight: 600;color: #000009; margin: 0 0 14px;">${signature.cargo}</div>
      <div style="font-size: 13px; line-height: 18px; font-weight: 550; color: #4b5563; margin: 0 0 10px;">${phones}</div>
      <div style="font-size: 14px; line-height: 18px; font-weight: 700; color: #c1121f; margin: 0 0 10px;">Movidos pelo crescimento e sucesso do cliente!</div>
      <img src="${SIGNATURE_LOGO_URL}" alt="Nérus" width="118" style="display: block; max-width: 118px;" />
      <div style="font-size: 14px; line-height: 18px; color: #c1121f; margin: 0 0 8px;">www.nerus.com.br</div>
    </td>
  </tr>
</table>`;
}

export default function Home() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedSignature = useMemo(
    () => signatures.find((signature) => signature.id === selectedId) || signatures[0],
    [selectedId, signatures],
  );
  const isActionRunning = saving || deletingId !== null;

  async function loadSignatures() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/signatures`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar as assinaturas.");
      }

      const data = (await response.json()) as Signature[];
      setSignatures(data);
      setSelectedId((current) => current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignatures();
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar imagem.");
      }

      const uploaded = await response.json() as {
        url: string | null;
        fileName: string;
        remotePath: string;
      };

      if (!uploaded.url) {
        throw new Error("Upload concluido, mas a URL publica nao foi retornada.");
      }

      const imageUrl = uploaded.url;
      setForm((current) => ({
        ...current,
        imagem: imageUrl,
        imagemArquivo: uploaded.fileName,
        imagemPath: uploaded.remotePath,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado no upload.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function editSignature(signature: Signature) {
    setEditingId(signature.id);
    setSelectedId(signature.id);
    setForm({
      nome: signature.nome,
      cargo: signature.cargo,
      telefone1: signature.telefone1 || "",
      telefone2: signature.telefone2 || DEFAULT_PHONE,
      imagem: signature.imagem,
      imagemArquivo: signature.imagemArquivo || "",
      imagemPath: signature.imagemPath || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveSignature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setActionMessage(editingId ? "Salvando alteracoes..." : "Criando assinatura...");
    setError("");

    try {
      const payload = {
        nome: form.nome,
        cargo: form.cargo,
        telefone1: form.telefone1,
        telefone2: form.telefone2,
        imagem: form.imagem,
        imagemArquivo: form.imagemArquivo,
        imagemPath: form.imagemPath,
      };

      const response = await fetch(
        editingId ? `${API_URL}/signatures/${editingId}` : `${API_URL}/signatures`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Nao foi possivel salvar.");
      }

      const saved = await response.json() as Signature;
      await loadSignatures();
      setSelectedId(saved.id);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
      setActionMessage("");
    }
  }

  async function deleteSignature(signature: Signature) {
    const confirmed = window.confirm(`Excluir a assinatura de ${signature.nome}?`);
    if (!confirmed) return;

    setError("");
    setDeletingId(signature.id);
    setActionMessage("Excluindo assinatura...");

    try {
      const response = await fetch(`${API_URL}/signatures/${signature.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir.");
      }

      await loadSignatures();
      if (editingId === signature.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao excluir.");
    } finally {
      setDeletingId(null);
      setActionMessage("");
    }
  }

  async function copyHtml() {
    if (!selectedSignature) return;

    const html = buildSignatureHtml(selectedSignature);

    const copyRenderedFallback = () => {
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "fixed";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNodeContents(container);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();
      document.body.removeChild(container);
    };

    try {
      if (!window.ClipboardItem) {
        copyRenderedFallback();
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([selectedSignature.nome], { type: "text/plain" }),
          }),
        ]);
      }
    } catch {
      copyRenderedFallback();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main
      className="shell"
      style={{ "--page-bg": `url("${BACKGROUND_URL}")` } as CSSProperties}
    >
      {isActionRunning && (
        <div className="busyOverlay" role="status" aria-live="polite">
          <div className="busyBox">
            <Loader2 className="spin" size={24} />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="brand">
          <img src={HEADER_LOGO_URL} alt="Nérus" />
          <div>
            <p className="eyebrow">Assinaturas Nérus</p>
            <h1>Assinaturas Nérus</h1>
          </div>
        </div>
        <button className="iconButton" type="button" onClick={loadSignatures} title="Atualizar">
          <RefreshCw size={18} />
        </button>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <section className="workspace">
        <form className="panel formPanel" onSubmit={saveSignature}>
          <div className="panelHeader">
            <div>
              <p className="eyebrow">{editingId ? "Edicao" : "Novo cadastro"}</p>
              <h2>{editingId ? "Editar assinatura" : "Criar assinatura"}</h2>
            </div>
            {editingId && (
              <button className="ghostButton" type="button" onClick={resetForm}>
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>

          <label>
            Nome
            <input
              required
              value={form.nome}
              onChange={(event) => updateField("nome", event.target.value)}
              placeholder="Nome completo"
            />
          </label>

          <label>
            Cargo
            <input
              required
              value={form.cargo}
              onChange={(event) => updateField("cargo", event.target.value)}
              placeholder="Cargo ou departamento"
            />
          </label>

          <div className="fieldGrid">
            <label>
              Telefone 1
              <input
                value={form.telefone1}
                onChange={(event) => updateField("telefone1", event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label>
              Telefone 2
              <input
                value={form.telefone2}
                onChange={(event) => updateField("telefone2", event.target.value)}
                placeholder={DEFAULT_PHONE}
              />
            </label>
          </div>

          <div className="uploadBox">
            <div className="uploadPreview">
              {form.imagem ? (
                <img src={form.imagem} alt="Prévia" />
              ) : (
                <ImagePlus size={28} />
              )}
            </div>
            <div>
              <label className="fileButton">
                {uploading ? <Loader2 className="spin" size={16} /> : <ImagePlus size={16} />}
                {uploading ? "Enviando" : "Enviar imagem"}
                <input accept="image/*" type="file" onChange={handleImageUpload} />
              </label>
              <p className="hint">{form.imagemArquivo || "PNG, JPG ou GIF usado na assinatura."}</p>
            </div>
          </div>

          <button className="primaryButton" type="submit" disabled={saving || uploading || !form.imagem}>
            {saving ? <Loader2 className="spin" size={18} /> : editingId ? <Save size={18} /> : <Plus size={18} />}
            {saving ? "Salvando" : editingId ? "Salvar alteracoes" : "Criar assinatura"}
          </button>
        </form>

        <section className="panel listPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">{signatures.length} registros</p>
              <h2>Assinaturas salvas</h2>
            </div>
          </div>

          <div className="list">
            {loading ? (
              <div className="emptyState">
                <Loader2 className="spin" size={24} />
                Carregando
              </div>
            ) : signatures.length === 0 ? (
              <div className="emptyState">Nenhuma assinatura cadastrada.</div>
            ) : (
              signatures.map((signature) => (
                <article
                  className={`signatureItem ${selectedSignature?.id === signature.id ? "active" : ""}`}
                  key={signature.id}
                  onClick={() => setSelectedId(signature.id)}
                >
                  <img src={signature.imagem} alt={signature.nome} />
                  <div>
                    <strong>{signature.nome}</strong>
                    <span>{signature.cargo}</span>
                  </div>
                  <div className="itemActions">
                    <button type="button" title="Editar" onClick={(event) => {
                      event.stopPropagation();
                      editSignature(signature);
                    }}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" title="Excluir" disabled={deletingId === signature.id} onClick={(event) => {
                      event.stopPropagation();
                      deleteSignature(signature);
                    }}>
                      {deletingId === signature.id ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="previewColumn">
          <div className="panel previewPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Prévia</p>
                <h2>Como ficará no Gmail</h2>
              </div>
              <button className="ghostButton" type="button" onClick={copyHtml} disabled={!selectedSignature}>
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>

            {selectedSignature ? (
              <div
                className="emailPreview"
                dangerouslySetInnerHTML={{ __html: buildSignatureHtml(selectedSignature) }}
              />
            ) : (
              <div className="emptyState">Selecione ou crie uma assinatura.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
