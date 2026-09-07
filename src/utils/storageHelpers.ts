import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';

export interface StorageUploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  contentType: string;
}

/**
  * Helper to ensure Firebase Auth session state is completely restored before checking currentUser.
  * Never relies on stale or uninitialized auth state.
  */
export async function getAuthenticatedUser() {
  if (auth.authStateReady) {
    await auth.authStateReady();
  }
  let currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    currentUser = auth.currentUser;
  }
  if (!currentUser || !currentUser.uid) {
    const err: any = new Error('You are not signed in. Please sign in to upload.');
    err.code = 'storage/unauthenticated';
    throw err;
  }
  try {
    await currentUser.getIdToken();
  } catch (tErr) {
    console.warn('Token verification notice during storage operation:', tErr);
  }
  return currentUser;
}

/**
 * Friendly localized storage error messages preserving actual error codes & details
 */
export function getStorageErrorMessage(error: any, lang: 'en' | 'fr' = 'en'): string {
  const code = error?.code || '';
  const message = error?.message || error?.toString() || '';

  if (code === 'storage/unauthenticated') {
    return lang === 'fr'
      ? 'Vous n’êtes pas connecté. Veuillez vous connecter pour téléverser.'
      : 'You are not signed in. Please sign in to upload.';
  }
  if (code === 'storage/unauthorized' || code === 'permission-denied' || message.includes('unauthorized')) {
    return lang === 'fr'
      ? `Permission refusée par le stockage Firebase (${code || 'unauthorized'}). Veuillez vérifier vos autorisations.`
      : `Firebase Storage permission denied (${code || 'unauthorized'}). Please check storage access permissions.`;
  }
  if (code === 'storage/canceled') {
    return lang === 'fr'
      ? 'Le téléversement a été annulé.'
      : 'The upload was canceled.';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return lang === 'fr'
      ? 'Délai d’attente dépassé. Veuillez vérifier votre connexion Internet et réessayer.'
      : 'Upload timed out. Please check your internet connection and try again.';
  }
  if (code === 'storage/quota-exceeded') {
    return lang === 'fr'
      ? 'Espace de stockage saturé. Veuillez contacter le support.'
      : 'Storage quota exceeded. Please contact support.';
  }
  if (code === 'storage/invalid-argument') {
    return message || (lang === 'fr' ? 'Fichier ou argument invalide.' : 'Invalid file or argument.');
  }
  if (message.includes('network') || message.includes('Failed to fetch') || code === 'storage/unknown') {
    return lang === 'fr'
      ? 'Erreur de connexion réseau. Veuillez vérifier votre connexion Internet.'
      : 'Network connection error. Please check your internet connection and try again.';
  }
  return message || (lang === 'fr'
    ? 'Échec du téléversement. Veuillez réessayer.'
    : 'Upload failed. Please try again.');
}

/**
 * Compress image using HTML5 canvas if file is large (> 1.5MB)
 */
export const compressImageIfNeeded = async (file: File): Promise<Blob | File> => {
  if (file.size <= 1.5 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1400;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

/**
 * Safely delete a file from Firebase Storage if path exists
 */
export const deleteStorageFile = async (storagePath?: string | null): Promise<void> => {
  if (!storagePath) return;
  // Security check: only allow deleting files in current authenticated user's folder
  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    const isPlayerImage = storagePath.startsWith(`player-images/${currentUid}/`);
    const isPlayerDoc = storagePath.startsWith(`player-documents/${currentUid}/`);
    const isPlayerVideo = storagePath.startsWith(`player-videos/${currentUid}/`);
    if (!isPlayerImage && !isPlayerDoc && !isPlayerVideo) {
      console.warn('Blocked deletion attempt for file not owned by user:', storagePath);
      return;
    }
  }
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Could not delete storage file or file does not exist:', storagePath, err);
  }
};

/**
 * Upload profile photo to player-images/{authenticatedUserId}/profile/{uniqueFileName}
 */
export const uploadProfilePhoto = async (
  userId: string,
  file: File | Blob,
  onProgress?: (progress: number) => void,
  customFileName?: string
): Promise<StorageUploadResult> => {
  const currentUser = await getAuthenticatedUser();
  const authenticatedUid = currentUser.uid;

  const rawName = (file instanceof File ? file.name : customFileName) || 'profile_photo.jpg';
  const fileExt = rawName.split('.').pop()?.toLowerCase() || 'jpg';
  
  let fileType = file.type?.toLowerCase() || '';
  if (!fileType || fileType === 'application/octet-stream') {
    if (['png'].includes(fileExt)) fileType = 'image/png';
    else if (['webp'].includes(fileExt)) fileType = 'image/webp';
    else fileType = 'image/jpeg';
  }

  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(rawName);
  if (file instanceof File && !isImage) {
    const err: any = new Error('Unsupported image format. Please select JPEG, PNG, or WEBP.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  if (file.size > 10 * 1024 * 1024) {
    const err: any = new Error('Image size exceeds 10 MB limit.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  const sanitizedName = rawName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `player-images/${authenticatedUid}/profile/${timestamp}_${sanitizedName}`;

  const compressedBlob = file instanceof File ? await compressImageIfNeeded(file) : file;
  const fileRef = ref(storage, storagePath);
  const contentType = fileType.startsWith('image/') ? fileType : 'image/jpeg';

  const uploadTask = uploadBytesResumable(fileRef, compressedBlob, {
    contentType,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: rawName,
            contentType,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Upload Google Account photo copy to player-images/{authenticatedUserId}/profile/{uniqueFileName}
 */
export const copyGooglePhotoToStorage = async (
  googlePhotoUrl: string,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> => {
  const currentUser = await getAuthenticatedUser();

  try {
    const response = await fetch(googlePhotoUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error('Failed to fetch Google photo due to network or CORS policy.');
    }
    const blob = await response.blob();
    return await uploadProfilePhoto(currentUser.uid, blob, onProgress, 'google_account_photo.jpg');
  } catch (err) {
    console.warn('CORS or network issue copying Google Photo directly:', err);
    throw err;
  }
};

/**
 * Upload Gallery Photo to player-images/{authenticatedUserId}/gallery/{photoId}/{uniqueFileName}
 */
export const uploadGalleryPhoto = async (
  photoId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> => {
  const currentUser = await getAuthenticatedUser();
  const authenticatedUid = currentUser.uid;

  const rawName = file.name || 'gallery_photo.jpg';
  const fileExt = rawName.split('.').pop()?.toLowerCase() || 'jpg';

  let fileType = file.type?.toLowerCase() || '';
  if (!fileType || fileType === 'application/octet-stream') {
    if (['png'].includes(fileExt)) fileType = 'image/png';
    else if (['webp'].includes(fileExt)) fileType = 'image/webp';
    else fileType = 'image/jpeg';
  }

  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(rawName);
  if (!isImage) {
    const err: any = new Error('Unsupported image format. Please select JPEG, PNG, or WEBP.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  if (file.size > 10 * 1024 * 1024) {
    const err: any = new Error('Image size exceeds 10 MB limit.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  const sanitizedName = rawName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `player-images/${authenticatedUid}/gallery/${photoId}/${timestamp}_${sanitizedName}`;

  const compressedBlob = await compressImageIfNeeded(file);
  const fileRef = ref(storage, storagePath);
  const contentType = fileType.startsWith('image/') ? fileType : 'image/jpeg';

  const uploadTask = uploadBytesResumable(fileRef, compressedBlob, { contentType });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            contentType,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Upload Video to player-videos/{authenticatedUserId}/{videoId}/{uniqueFileName}
 */
export const uploadPlayerVideo = async (
  videoId: string,
  file: File,
  onProgress?: (progress: number) => void,
  onTaskCreated?: (task: ReturnType<typeof uploadBytesResumable>) => void
): Promise<StorageUploadResult> => {
  const currentUser = await getAuthenticatedUser();
  const authenticatedUid = currentUser.uid;

  const validVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/mpeg',
  ];
  
  const isVideo = validVideoTypes.includes(file.type.toLowerCase()) || 
                  /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);

  if (!isVideo) {
    const err: any = new Error('Unsupported video format. Please select an MP4, WEBM, or MOV video file.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  // 100 MB Limit
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_VIDEO_SIZE) {
    const err: any = new Error('Video file size exceeds the 100 MB limit.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `player-videos/${authenticatedUid}/${videoId}/${timestamp}_${sanitizedName}`;

  const fileRef = ref(storage, storagePath);
  const contentType = file.type || 'video/mp4';

  const uploadTask = uploadBytesResumable(fileRef, file, { contentType });
  if (onTaskCreated) onTaskCreated(uploadTask);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            contentType,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Upload Soccer CV to player-documents/{authenticatedUserId}/cv/{uniqueFileName}
 */
export const uploadSoccerCv = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> => {
  const currentUser = await getAuthenticatedUser();
  const authenticatedUid = currentUser.uid;

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    const err: any = new Error('Unsupported document format. Please select a PDF file.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  if (file.size > 10 * 1024 * 1024) {
    const err: any = new Error('Document size exceeds 10 MB limit.');
    err.code = 'storage/invalid-argument';
    throw err;
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `player-documents/${authenticatedUid}/cv/${timestamp}_${sanitizedName}`;

  const fileRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: 'application/pdf',
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            contentType: 'application/pdf',
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
