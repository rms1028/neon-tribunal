interface Window {
  gtag?: (
    command: "config" | "event" | "js",
    targetOrName: string | Date,
    params?: Record<string, string | number | boolean>
  ) => void;
}
