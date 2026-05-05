/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SFTP_BASE_URL: process.env.NEXT_PUBLIC_SFTP_BASE_URL,
  },
};

module.exports = nextConfig;
