export function getSavedBookmarks() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem("noorBookmarks") || "[]");
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("noorBookmarks", JSON.stringify(bookmarks));
  window.dispatchEvent(new Event("bookmarksUpdated"));
}

export function getBookmarkCount() {
  return getSavedBookmarks().length;
}
