import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Post, Comment as CommentType } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const uploadFile = async (file: File, folder: string) => {
  try {
    // Get the user's ID Token to prove identity to the server
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const idToken = await user.getIdToken();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('idToken', idToken); // Send the token

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('File Upload Error:', error);
    if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error('Storage CORS error: Please ensure your bucket allows requests from this domain.');
    }
    throw error;
  }
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>) => {
  const path = 'posts';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...postData,
      createdAt: Timestamp.now(),
      likes: [],
      views: 0,
      commentsCount: 0
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updatePost = async (postId: string, postData: Partial<Post>) => {
  const path = `posts/${postId}`;
  try {
    const docRef = doc(db, 'posts', postId);
    await updateDoc(docRef, postData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePost = async (postId: string) => {
  const path = `posts/${postId}`;
  try {
    const docRef = doc(db, 'posts', postId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getPosts = (callback: (posts: Post[]) => void) => {
  const path = 'posts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
    callback(posts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getUserPosts = (userId: string, callback: (posts: Post[]) => void) => {
  const path = 'posts';
  const q = query(
    collection(db, path), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
    callback(posts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getPostById = async (postId: string) => {
  const path = `posts/${postId}`;
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const toggleLikePost = async (postId: string, userId: string, currentLikes: string[] = []) => {
  const path = `posts/${postId}`;
  try {
    const docRef = doc(db, 'posts', postId);
    const hasLiked = currentLikes.includes(userId);
    const newLikes = hasLiked 
      ? currentLikes.filter(id => id !== userId)
      : [...currentLikes, userId];
    
    await updateDoc(docRef, { likes: newLikes });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const incrementPostViews = async (postId: string) => {
  const path = `posts/${postId}`;
  try {
    const docRef = doc(db, 'posts', postId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const createComment = async (postId: string, commentData: Omit<CommentType, 'id' | 'createdAt'>) => {
  const path = `posts/${postId}/comments`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...commentData,
      createdAt: Timestamp.now()
    });
    
    // Increment comment count on the post
    await updateDoc(doc(db, 'posts', postId), {
      commentsCount: increment(1)
    });
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getCommentsByPost = (postId: string, callback: (comments: CommentType[]) => void) => {
  const path = `posts/${postId}/comments`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommentType[];
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
