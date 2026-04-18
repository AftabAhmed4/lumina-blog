import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status?: 'published' | 'draft';
  imageURL: string;
  audioURL?: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  likes: string[]; // Array of user IDs
  views: number;
  commentsCount?: number;
  category: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Timestamp;
}
