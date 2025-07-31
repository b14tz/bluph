import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: parseInt(process.env.VITE_CLIENT_PORT || "8002"),
    },
});
