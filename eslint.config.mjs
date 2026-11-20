import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // All user-facing copy lives in /messages. A literal string in JSX is a bug.
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["·", "—", "…", "/", ":", "(", ")"] },
      ],
    },
  },
  {
    // Server secrets and the service-role client must never be imported from client code.
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message: "The service-role client is only for lib/server code and route handlers.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "worker/**", "public/sw.js"]),
]);

export default eslintConfig;
