import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "hardhat.config.ts",
    "scripts/**",
    "typechain-types/**",
    "artifacts/**",
  ]),
  {
    rules: {
      // Warnings only — tidak block build
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // False positives — pattern ini valid (setState dari external data / route change / localStorage)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
