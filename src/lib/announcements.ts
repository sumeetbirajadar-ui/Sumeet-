// Admin-authored announcements/content notices shown to students.
// Firestore-backed so an admin's publish reaches every student's device live.

import { subscribeCollection, addDocument, updateDocument, deleteDocument } from './firebase';

const COLLECTION = 'announcements';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export function subscribeAnnouncements(onData: (items: Announcement[]) => void): () => void {
  return subscribeCollection<Omit<Announcement, 'id'>>(COLLECTION, (items) => {
    onData([...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  });
}

export function subscribePublished(onData: (items: Announcement[]) => void): () => void {
  return subscribeAnnouncements((items) => onData(items.filter((a) => a.status === 'published')));
}

export async function createAnnouncement(title: string, body: string): Promise<void> {
  const now = new Date().toISOString();
  // Same reasoning as live classes and content: publish immediately, no
  // hidden draft step to remember — the publish/unpublish toggle is still
  // there afterward if it needs to come down.
  await addDocument(COLLECTION, { title, body, status: 'published', createdAt: now, updatedAt: now });
}

export async function updateAnnouncement(id: string, patch: Partial<Pick<Announcement, 'title' | 'body' | 'status'>>): Promise<void> {
  await updateDocument(COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}
