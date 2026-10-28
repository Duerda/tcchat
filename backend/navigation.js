const APP_ROOT = new URL("../", import.meta.url);

export function appUrl(path) {
  return new URL(String(path).replace(/^\/+/, ""), APP_ROOT).href;
}

export function navigate(path) {
  const destination = String(path);
  window.location.href = destination.startsWith("/")
    ? appUrl(destination)
    : new URL(destination, window.location.href).href;
}
