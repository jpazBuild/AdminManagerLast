// src/lib/editorTheme.ts
export const editorTheme = {
  paragraph: "mb-2",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  },
  code: "block w-full rounded-md font-mono text-xs px-4 py-3 overflow-auto " +
        "bg-[#fafafa] text-[#383a42] dark:bg-[#282c34] dark:text-[#abb2bf]",
  codeHighlight: {
  },
  heading: {
    h1: "text-2xl font-bold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-semibold",
  },
  quote: "border-l-4 border-muted pl-4 italic",
  list: {
    nested: {
      listitem: "ml-6",
    },
    ol: "list-decimal ml-6",
    ul: "list-disc ml-6",
    listitem: "my-1",
  },
};
export default editorTheme;
