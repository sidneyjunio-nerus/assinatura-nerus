import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../services/sftp";

const router = Router();
const upload = multer();

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      console.warn("[upload] requisicao sem arquivo");
      return res.status(400).json({ error: "Arquivo obrigatorio" });
    }

    const safeName = sanitizeFileName(file.originalname);
    const fileName = Date.now() + "-" + safeName;

    console.info("[upload] arquivo recebido", {
      originalName: file.originalname,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
    });

    const uploadedFile = await uploadFile(file.buffer, fileName);

    console.info("[upload] arquivo enviado com sucesso", uploadedFile);
    res.json(uploadedFile);
  } catch (err) {
    console.error("[upload] erro no upload", {
      message: err instanceof Error ? err.message : err,
    });
    res.status(500).json({ error: "Erro no upload" });
  }
});

export default router;
