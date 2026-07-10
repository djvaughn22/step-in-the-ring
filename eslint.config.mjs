import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Backup snapshots + synced Open Mirror chrome — not linted here.
    ".stepinthering-backups/**",
    "app/OpenMirrorNav.tsx",
    "app/OpenMirrorFooter.tsx",
    "app/OpenMirrorTheme.tsx",
  ]),
]);

export default eslintConfig;
