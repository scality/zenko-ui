// Shim for ESM-only packages (shiki, @shikijs) required by codemirror-json-schema.
// These ship only .mjs files with no CJS fallback, which breaks Jest's require().
// Only used for markdown rendering in editor tooltips — not relevant for tests.
module.exports = {
  createHighlighterCore: () => Promise.resolve({}),
  fromHighlighter: () => () => {},
};
