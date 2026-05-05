import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Signature } from "../entity/Signature";
import { deleteFile } from "../services/sftp";

const router = Router();
const TELEFONE2_PLACEHOLDER = "(31) 3273-4415";

const valueOrNull = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const valueOrEmpty = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const valueOrPlaceholder = (value: unknown) => {
  if (typeof value !== "string") return TELEFONE2_PLACEHOLDER;
  const trimmed = value.trim();
  return trimmed || TELEFONE2_PLACEHOLDER;
};

// CREATE
router.post("/", async (req, res) => {
  try {
    console.info("[signatures] criando assinatura", {
      nome: req.body.nome,
      temImagem: Boolean(req.body.imagem),
      imagem: req.body.imagem,
      imagemArquivo: req.body.imagemArquivo,
      imagemPath: req.body.imagemPath,
    });

    const nome = valueOrNull(req.body.nome);
    const cargo = valueOrNull(req.body.cargo);
    const telefone1 = valueOrEmpty(req.body.telefone1);
    const imagem = valueOrNull(req.body.imagem);
    const imagemArquivo = valueOrNull(req.body.imagemArquivo);
    const imagemPath = valueOrNull(req.body.imagemPath);

    if (!nome || !cargo || !imagem) {
      return res.status(400).json({ error: "Campos obrigatorios" });
    }

    const repo = AppDataSource.getRepository(Signature);

    const sig = repo.create({
      nome,
      cargo,
      telefone1,
      telefone2: valueOrPlaceholder(req.body.telefone2),
      imagem,
      imagemArquivo,
      imagemPath,
    });

    await repo.save(sig);

    console.info("[signatures] assinatura criada", {
      id: sig.id,
      imagem: sig.imagem,
      imagemArquivo: sig.imagemArquivo,
      imagemPath: sig.imagemPath,
    });

    res.json(sig);
  } catch (err) {
    console.error("[signatures] erro ao salvar", {
      message: err instanceof Error ? err.message : err,
    });
    res.status(500).json({ error: "Erro ao salvar" });
  }
});

// LIST
router.get("/", async (_, res) => {
  const repo = AppDataSource.getRepository(Signature);
  const all = await repo.find();
  res.json(all);
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(Signature);
    const { id } = req.params;

    console.info("[signatures] atualizando assinatura", {
      id,
      temImagem: Boolean(req.body.imagem),
      imagem: req.body.imagem,
      imagemArquivo: req.body.imagemArquivo,
      imagemPath: req.body.imagemPath,
    });

    const existing = await repo.findOneBy({ id: Number(id) });

    if (!existing) {
      return res.status(404).json({ error: "Nao encontrado" });
    }

    const nome = valueOrNull(req.body.nome);
    const cargo = valueOrNull(req.body.cargo);
    const telefone1 = valueOrEmpty(req.body.telefone1);
    const imagem = valueOrNull(req.body.imagem) || existing.imagem;
    const imagemArquivo = valueOrNull(req.body.imagemArquivo) || existing.imagemArquivo;
    const imagemPath = valueOrNull(req.body.imagemPath) || existing.imagemPath;

    if (!nome || !cargo || !imagem) {
      return res.status(400).json({ error: "Campos obrigatorios" });
    }

    const updated = repo.merge(existing, {
      nome,
      cargo,
      telefone1,
      telefone2: valueOrPlaceholder(req.body.telefone2),
      imagem,
      imagemArquivo,
      imagemPath,
    });

    await repo.save(updated);

    console.info("[signatures] assinatura atualizada", {
      id: updated.id,
      imagem: updated.imagem,
      imagemArquivo: updated.imagemArquivo,
      imagemPath: updated.imagemPath,
    });

    res.json(updated);
  } catch (err) {
    console.error("[signatures] erro ao atualizar", {
      message: err instanceof Error ? err.message : err,
    });
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(Signature);
    const { id } = req.params;

    const existing = await repo.findOneBy({ id: Number(id) });

    if (!existing) {
      return res.status(404).json({ error: "Nao encontrado" });
    }

    const remotePath = existing.imagemPath;

    await repo.remove(existing);

    if (remotePath) {
      try {
        await deleteFile(remotePath);
      } catch (err) {
        console.warn("[signatures] assinatura removida, mas imagem nao foi excluida do sftp", {
          id,
          remotePath,
          message: err instanceof Error ? err.message : err,
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[signatures] erro ao remover", {
      id: req.params.id,
      message: err instanceof Error ? err.message : err,
    });
    res.status(500).json({ error: "Erro ao remover" });
  }
});

export default router;
