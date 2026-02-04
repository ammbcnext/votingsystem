import { dirname, join } from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        // Alias @ per la root del progetto
        config.resolve.alias['@'] = join(__dirname);
        return config;
    },
};

export default nextConfig;
