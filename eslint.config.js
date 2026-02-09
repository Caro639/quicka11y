import js from "@eslint/js";
import jest from "eslint-plugin-jest";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        chrome: "readonly",
        browser: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        alert: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Promise: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "max-len": [
        "warn",
        {
          code: 120,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      complexity: ["warn", 10],
      "no-magic-numbers": [
        "warn",
        {
          ignore: [0, 1, -1, 2, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      "no-duplicate-imports": "error",
      "prefer-template": "warn",
      "no-nested-ternary": "warn",
      "no-else-return": "warn",
      "consistent-return": "error",
      camelcase: ["warn", { properties: "never" }],
    },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js"],
    plugins: { jest },
    languageOptions: {
      globals: {
        ...jest.environments.globals.globals,
        // Globals pour jsdom (environnement de test)
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        CustomEvent: "readonly",
      },
    },
    rules: {
      ...jest.configs.recommended.rules,
    },
  },
  {
    // Configuration pour les fichiers de setup Jest
    files: ["jest.setup.js", "mock-extension-apis.js"],
    languageOptions: {
      globals: {
        ...jest.environments.globals.globals,
        global: "writable",
      },
    },
    rules: {
      "no-magic-numbers": "off",
    },
  },
  {
    // Configuration pour les fichiers CommonJS (.cjs)
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
      },
    },
  },
  {
    ignores: ["node_modules/", "coverage/"],
  },
];
