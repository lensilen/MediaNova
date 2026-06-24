# Technical Documentation - MediaNova

## 1. Ringkasan Sistem

MediaNova adalah aplikasi social media multimedia berbasis Expo React Native. Aplikasi mendukung autentikasi, feed multimedia, pembuatan video/foto/audio, editor sederhana, interaksi sosial, profile, search, notifikasi, dan upload media.

## 2. Architecture Diagram

```text
┌──────────────────────────┐
│ React Native / Expo App  │
│ Expo Router Screens      │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Hooks + Zustand Stores   │
│ useAuth, useFeed, draft  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Utility Layer            │
│ auth, posts, social,     │
│ profile, upload, cache   │
└───────┬──────────┬───────┘
        │          │
        ▼          ▼
┌──────────────┐  ┌────────────────┐
│ Firebase     │  │ Cloudinary      │
│ Auth         │  │ Media Upload    │
│ Firestore    │  │ Delivery URL    │
│ Storage      │  │ Thumbnail URL   │
└──────────────┘  └────────────────┘
```

## 3. Struktur Folder Penting

```text
src/app/                 Routing Expo Router
src/screens/auth/        Login dan Register
src/screens/home/        Feed utama dan search
src/screens/create/      Camera, recorder, editor, preview post
src/screens/profile/     Profile dan settings
src/screens/media/       Media viewer
src/components/home/     VideoCard, action buttons, comments
src/components/profile/  Profile grid dan connection sheet
src/store/               Zustand stores
src/utils/               Firebase, upload, posts, social, profile, cache
```

## 4. Data Flow Utama

### 4.1 Auth

1. User register/login melalui Firebase Authentication.
2. Data profile user disimpan di collection `users`.
3. Google Sign-In memakai `expo-auth-session` dan Firebase credential.

### 4.2 Create Post

1. User record video/foto/audio atau pilih dari galeri.
2. Media masuk ke preview/editor lokal.
3. User isi title, caption, location, visibility, dan allow comments.
4. Media diupload via Cloudinary jika env Cloudinary tersedia.
5. Jika Cloudinary tidak tersedia, upload fallback ke Firebase Storage.
6. Metadata post disimpan ke Firestore collection `posts`.
7. Feed membaca `posts` secara realtime.

### 4.3 Feed Interaction

1. Like disimpan ke collection `likes`.
2. Comment disimpan ke collection `comments`.
3. Save disimpan ke collection `saves`.
4. Counter pada document `posts` diperbarui.
5. Notification dibuat di collection `notifications` untuk owner post.

## 5. Firestore Schema

### users/{userId}

```js
{
  uid: string,
  email: string,
  emailLower: string,
  displayName: string,
  displayNameLower: string,
  photoURL: string,
  bio: string,
  followers: number,
  following: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### posts/{postId}

```js
{
  userId: string,
  type: "video" | "photo" | "audio",
  mediaURL: string,
  thumbnailURL: string,
  title: string,
  titleLower: string,
  caption: string,
  captionLower: string,
  username: string,
  displayName: string,
  photoURL: string,
  location: string,
  locationLower: string,
  visibility: "everyone" | "followers",
  allowComments: boolean,
  editMeta: object,
  likes: number,
  saves: number,
  commentsCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### likes/{postId_userId}

```js
{
  postId: string,
  userId: string,
  ownerId: string,
  createdAt: Timestamp
}
```

### saves/{postId_userId}

```js
{
  postId: string,
  userId: string,
  ownerId: string,
  createdAt: Timestamp
}
```

### comments/{commentId}

```js
{
  postId: string,
  userId: string,
  text: string,
  authorName: string,
  authorPhotoURL: string,
  ownerId: string,
  createdAt: Timestamp
}
```

### follows/{followerId_followingId}

```js
{
  followerId: string,
  followingId: string,
  createdAt: Timestamp
}
```

### notifications/{notificationId}

```js
{
  toUserId: string,
  fromUserId: string,
  type: "like" | "comment" | "follow" | "mention" | "save",
  postId: string,
  read: boolean,
  createdAt: Timestamp
}
```

## 6. API / Utility Documentation

### Auth - `src/utils/auth.js`

- `loginWithEmail(email, password)`
- `registerWithEmail(email, password, displayName)`
- `loginWithGoogle(idToken)`
- `logout()`
- `ensureUserProfile(user, overrides)`

### Posts - `src/utils/posts.js`

- `createPost(userId, type, mediaURL, thumbnailURL, caption, metadata)`
- `getFeedPosts(pageSize, lastDoc)`
- `subscribeFeedPosts(pageSize, onChange, onError)`
- `getUserPosts(userId)`
- `getPostById(postId)`
- `deletePost(postId)`

### Social - `src/utils/socialPosts.js`

- `likePost(postId, userId)`
- `unlikePost(postId, userId)`
- `isLiked(postId, userId)`
- `addComment(postId, userId, text, author)`
- `getComments(postId, limitValue)`
- `savePost(postId, userId)`
- `unsavePost(postId, userId)`
- `isSaved(postId, userId)`

### Follow - `src/utils/socialFollows.js`

- `followUser(followerId, followingId)`
- `unfollowUser(followerId, followingId)`
- `isFollowing(followerId, followingId)`

### Upload - `src/utils/upload.js`

- `uploadImage(uri, onProgress, options)`
- `uploadAudio(uri, onProgress, options)`
- `uploadVideo(uri, onProgress, options)`
- `uploadChunked(uri, onProgress, options)`

### Notification - `src/utils/notifications.js`

- `createNotification(toUserId, fromUserId, type, postId)`
- `getNotifications(userId)`
- `subscribeNotifications(userId, callback, onError)`
- `markNotificationAsRead(notificationId)`
- `subscribeUnreadCount(userId, callback, onError)`

## 7. Security Rules

Firestore rules ada di `firestore.rules`. Storage rules ada di `storage.rules`.

Prinsip utama:

- User harus login untuk membuat post, like, comment, save, follow, dan upload.
- User hanya boleh mengubah data profile miliknya sendiri.
- Counter followers/following dibatasi agar tidak negatif.
- Post dapat dibaca publik, tetapi pembuatan post wajib authenticated.

## 8. Media Optimization

- Foto diproses melalui `expo-image-manipulator`.
- Video dapat dikompresi melalui `react-native-compressor` bila native build mendukung.
- Upload besar memakai progress callback.
- Cloudinary delivery URL dipakai untuk memudahkan preview media di feed/profile.
- Firebase Storage tetap tersedia sebagai fallback upload.

## 9. Limitasi Teknis

- Editor video/audio belum melakukan render final setara CapCut. Sebagian fitur editor menyimpan metadata dan preview UI.
- Face tracking sticker penuh masih bergantung native dependency dan dapat berbeda per device.
- Push notification background full memerlukan backend trigger seperti Firebase Cloud Functions.
- Jika file lokal cache hilang sebelum upload, preview editor dapat gagal menampilkan media.

## 10. Testing Checklist

- `npm run lint`
- `npx expo export --platform android`
- Login/register email password
- Login Google pada APK native
- Upload video/foto/audio dan cek muncul di feed
- Like/comment/save dari akun kedua
- Follow/unfollow akun lain
- Cek notification sheet
- Cek profile tab Media, Comments, Likes, Saved
- Build APK dengan `npx eas build --profile preview --platform android`
