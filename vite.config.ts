import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/MalFrame/" : "/",

  server: {
    host: "::",
    port: 8088
  },
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    mode === "production" && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
    // Gzip compression for production
    mode === "production" && viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli compression for production (better compression than gzip)
    mode === "production" && viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    // Optimize source maps for production
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunks for aggressive code splitting
        manualChunks: (id) => {
          // React core - always needed
          if (id.includes("node_modules/react-dom")) {
            return "vendor-react-dom";
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          
          // Virtual scrolling - only used in IOCTable, lazy loaded
          if (id.includes("@tanstack/react-virtual") || id.includes("@tanstack/virtual-core")) {
            return "vendor-virtual";
          }
          
          // Radix UI — all in one chunk to avoid circular dependency warnings
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }
          
          // Icons - keep in main chunk for better caching (small per-icon size)
          // lucide-react tree-shakes well with named imports
          
          // Export libraries - loaded on demand only (lazy)
          if (id.includes("node_modules/jspdf")) {
            return "export-pdf";
          }
          if (id.includes("node_modules/docx")) {
            return "export-docx";
          }
          
          // Sonner toasts
          if (id.includes("sonner")) {
            return "vendor-toast";
          }
          
          // Zod validation - commonly used, keep separate for caching
          if (id.includes("node_modules/zod")) {
            return "vendor-zod";
          }
          
          // Tailwind utilities
          if (id.includes("tailwind-merge") || id.includes("clsx") || id.includes("class-variance-authority")) {
            return "vendor-tailwind";
          }
          
          // Large data files - lazy loaded, separate chunks
          if (id.includes("src/lib/mbcData")) {
            return "data-mbc";
          }
          if (id.includes("src/lib/toolsData")) {
            return "data-tools";
          }
          
          // MITRE utilities - lazy loaded with MitreAttackMapping
          if (id.includes("src/lib/mitreUtils")) {
            return "utils-mitre";
          }
          
          // Validation schemas - used across dashboards, separate for caching
          if (id.includes("src/lib/validationSchemas")) {
            return "utils-validation";
          }
          
          // Export utilities - lazy loaded on demand
          if (id.includes("src/lib/export/pdf") || id.includes("src/lib/export/word")) {
            return "utils-export";
          }
          
          // Translations - separate chunks per language for easy addition
          if (id.includes("src/lib/translations/en")) {
            return "i18n-en";
          }
          if (id.includes("src/lib/translations/vn")) {
            return "i18n-vn";
          }
          
          // Heavy components - already lazy loaded, ensure separate chunks
          if (id.includes("src/features/mia/components/MitreAttackMapping")) {
            return "component-mitre";
          }
          if (id.includes("src/features/mre/components/MBCMapping")) {
            return "component-mbc";
          }
          if (id.includes("src/features/mia/components/IOCTable")) {
            return "component-ioc";
          }
          if (id.includes("src/features/mre/components/CodeAnalysisGroups") || id.includes("src/features/mre/components/code-analysis")) {
            return "component-code-analysis";
          }
          if (id.includes("src/features/mre/components/runtime-behavior")) {
            return "component-runtime";
          }
          if (id.includes("src/features/mia/components/EvidenceArtifacts")) {
            return "component-evidence";
          }
          if (id.includes("src/features/mia/components/TimelineTable")) {
            return "component-timeline";
          }
          // UnpackingLayers - includes AlertDialog
          if (id.includes("src/components/UnpackingLayers")) {
            return "component-unpacking";
          }
          // NotesLog - includes ImageGrid and form handling
          if (id.includes("src/components/NotesLog")) {
            return "component-notes";
          }
          // FileHashDropzone - includes Progress
          if (id.includes("src/components/FileHashDropzone")) {
            return "component-dropzone";
          }
          // StaticAnalysisCards + SecurityPosture
          if (id.includes("src/features/mre/components/StaticAnalysisCards") || id.includes("src/features/mre/components/SecurityPosture")) {
            return "component-static-analysis";
          }
          // PESectionEntry + PackedDropdown
          if (id.includes("src/features/mre/components/PESectionEntry") || id.includes("src/features/mre/components/PackedDropdown")) {
            return "component-pe-analysis";
          }
          // ExportConfirmDialog - includes Dialog, Checkbox
          if (id.includes("src/components/ExportConfirmDialog")) {
            return "component-export-dialog";
          }
          // Easter Egg - separate chunk with obfuscated content
          if (id.includes("src/components/header/EasterEgg")) {
            return "component-hidden";
          }
          
          // Dashboard pages - ensure separate chunks for route splitting
          if (id.includes("src/pages/Index")) {
            return "page-index";
          }
          if (id.includes("src/pages/MIADashboard")) {
            return "page-mia";
          }
          if (id.includes("src/pages/MREDashboard")) {
            return "page-mre";
          }
          if (id.includes("src/pages/Tools")) {
            return "page-tools";
          }
          if (id.includes("src/pages/Settings")) {
            return "page-settings";
          }
          if (id.includes("src/pages/NotFound")) {
            return "page-404";
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] || '';
          if (name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Report compressed sizes
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
    ],
    exclude: [
      "jspdf",
      "docx",
    ],
  },
}));
