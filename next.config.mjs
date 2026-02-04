import { join } from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        appDir: true,
    },
    webpack: (config) => {
        // Alias @ per la root del progetto
        config.resolve.alias['@'] = join(__dirname);
        return config;
    },
};

export default nextConfig;
