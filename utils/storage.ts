import type { Design } from "../types";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cmac-roof-studio", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("designs", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readDesigns(): Promise<Design[]> {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("designs").objectStore("designs").getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as Design[]).sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
        );
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function storeDesign(design: Design) {
  await mutate((store) => store.put(design));
}
export async function deleteDesign(id: string) {
  await mutate((store) => store.delete(id));
}
async function mutate(action: (store: IDBObjectStore) => void) {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("designs", "readwrite");
      action(tx.objectStore("designs"));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
