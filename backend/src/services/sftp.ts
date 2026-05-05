import Client from "ssh2-sftp-client";

const SFTP_REMOTE_DIR = process.env.SFTP_REMOTE_DIR || "/";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
};

const publicBaseUrl = () => {
  const value = process.env.SFTP_BASE_URL || process.env.NEXT_PUBLIC_SFTP_BASE_URL;
  if (!value) {
    console.warn("[sftp] URL publica nao configurada", {
      expected: "SFTP_BASE_URL ou NEXT_PUBLIC_SFTP_BASE_URL",
    });
    return null;
  }
  return value.replace(/\/+$/, "");
};

export async function uploadFile(fileBuffer: Buffer, fileName: string) {
  const sftp = new Client();
  const remoteDir = SFTP_REMOTE_DIR.replace(/\/+$/, "");
  const remotePath = remoteDir ? `${remoteDir}/${fileName}` : `/${fileName}`;
  const baseUrl = publicBaseUrl();
  const url = baseUrl ? `${baseUrl}/${fileName}` : null;

  console.info("[sftp] iniciando upload", {
    fileName,
    size: fileBuffer.length,
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    remotePath,
    url,
  });

  try {
    await sftp.connect({
      host: requireEnv("SFTP_HOST"),
      port: Number(requireEnv("SFTP_PORT")),
      username: requireEnv("SFTP_USER"),
      password: requireEnv("SFTP_PASS"),
    });

    console.info("[sftp] conectado", { host: process.env.SFTP_HOST });

    await sftp.put(fileBuffer, remotePath);

    console.info("[sftp] upload concluido", {
      fileName,
      remotePath,
      url,
    });

    return {
      url,
      fileName,
      remotePath,
    };
  } catch (err) {
    console.error("[sftp] falha no upload", {
      fileName,
      remotePath,
      message: err instanceof Error ? err.message : err,
    });
    throw err;
  } finally {
    try {
      await sftp.end();
      console.info("[sftp] conexao encerrada", { fileName });
    } catch (err) {
      console.warn("[sftp] falha ao encerrar conexao", {
        fileName,
        message: err instanceof Error ? err.message : err,
      });
    }
  }
}

const isSafeRemotePath = (remotePath: string) =>
  remotePath.startsWith("/") && !remotePath.split("/").includes("..");

export async function deleteFile(remotePath: string) {
  if (!isSafeRemotePath(remotePath)) {
    throw new Error(`Caminho remoto invalido para exclusao: ${remotePath}`);
  }

  const sftp = new Client();

  console.info("[sftp] iniciando exclusao", {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    remotePath,
  });

  try {
    await sftp.connect({
      host: requireEnv("SFTP_HOST"),
      port: Number(requireEnv("SFTP_PORT")),
      username: requireEnv("SFTP_USER"),
      password: requireEnv("SFTP_PASS"),
    });

    await sftp.delete(remotePath);

    console.info("[sftp] arquivo excluido", { remotePath });
  } catch (err) {
    console.error("[sftp] falha ao excluir arquivo", {
      remotePath,
      message: err instanceof Error ? err.message : err,
    });
    throw err;
  } finally {
    try {
      await sftp.end();
      console.info("[sftp] conexao encerrada", { remotePath });
    } catch (err) {
      console.warn("[sftp] falha ao encerrar conexao", {
        remotePath,
        message: err instanceof Error ? err.message : err,
      });
    }
  }
}
