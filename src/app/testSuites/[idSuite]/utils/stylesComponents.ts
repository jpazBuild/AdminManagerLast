export type ChipVariant = "a" | "b" | "c";

export const getUiThemeClasses = (isDarkMode: boolean) => {
  const surface = isDarkMode
    ? "bg-gray-800 border border-gray-700 text-white"
    : "bg-white border border-gray-200 text-primary";

  const strongText = isDarkMode ? "text-white/90" : "text-primary";
  const softText = isDarkMode ? "text-white/80" : "text-primary/80";
  const tableBorder = isDarkMode ? "border-gray-700" : "border-gray-200";
  const tableHeaderBg = isDarkMode ? "bg-gray-900" : "bg-gray-100";
  const rowHover = isDarkMode ? "hover:bg-gray-900/60" : "hover:bg-gray-50";

  const chip = (variant: ChipVariant) =>
    variant === "a"
      ? isDarkMode
        ? "text-xs bg-gray-900 text-white px-2 py-1 rounded-md"
        : "text-xs bg-primary/70 text-white px-2 py-1 rounded-md"
      : variant === "b"
        ? isDarkMode
          ? "text-xs bg-gray-700 text-white px-2 py-1 rounded-md"
          : "text-xs bg-primary/50 text-white px-2 py-1 rounded-md"
        : isDarkMode
          ? "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md"
          : "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md";

  return { surface, strongText, softText, tableBorder, tableHeaderBg, rowHover, chip };
};
