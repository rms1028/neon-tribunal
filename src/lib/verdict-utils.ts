export function stripMetaTags(text: string): string {
  return text
    .replace(/\n*\[\[TLDR:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[VIRAL:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[STORY:\s*.+?\]\]\s*/g, "")
    .replace(/\n*\[\[CATEGORY:\s*.+?\]\]\s*/g, "")
    .trim();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
