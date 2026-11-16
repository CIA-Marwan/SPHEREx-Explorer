export const staticOnly = import.meta.env.MODE === "pages";

export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
