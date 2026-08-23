// Admin-authored announcements/content notices shown to students.
// Local-storage backed for now (single-device demo); swap the storage calls
// here for Firestore reads/writes once a Firebase project is wired up, the
// rest of the app doesn't need to change.

const STORAGE_KEY = 'admin_announcements_v1';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export function listAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Announcement[];
  } catch {
    return [];
  }
}

export function listPublished(): Announcement[] {
  return listAnnouncements()
    .filter((a) => a.status === 'published')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function save(items: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createAnnouncement(title: string, body: string): Announcement {
  const now = new Date().toISOString();
  const item: Announcement = {
    id: `a_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    title,
    body,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  save([item, ...listAnnouncements()]);
  return item;
}

export function updateAnnouncement(id: string, patch: Partial<Pick<Announcement, 'title' | 'body' | 'status'>>) {
  const items = listAnnouncements().map((a) =>
    a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
  );
  save(items);
  return items;
}

export function deleteAnnouncement(id: string) {
  const items = listAnnouncements().filter((a) => a.id !== id);
  save(items);
  return items;
}
