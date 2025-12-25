export const resolveSceneImage = (src: string) => {
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) {
    return src;
  }

  const normalized = src.startsWith("/") ? src.slice(1) : src;
  const rawBase = import.meta.env.BASE_URL ?? "/";
  const basePath = rawBase === "" ? "/" : rawBase;
  return `${basePath.replace(/\/+$/, "")}/${normalized}`;
};
