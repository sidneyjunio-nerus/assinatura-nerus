import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import signatureRoutes from "./routes/signature";
import uploadRoutes from "./routes/upload";

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());

app.use("/signatures", signatureRoutes);
app.use("/upload", uploadRoutes);
AppDataSource.initialize()
  .then(() => {
    console.log("Banco conectado ✅");
    app.listen(3001, () => console.log("Backend rodando"));
  })
  .catch((err) => console.error("Erro DB ❌", err));
