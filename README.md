# MediaNova

MediaNova adalah aplikasi social media multimedia untuk Kelompok 3 dengan fokus video shorts, audio post, photo post, camera filter, editor sederhana, feed interaktif, profile, search, dan notifikasi.

## Tech Stack

- Expo SDK 56, React Native, Expo Router
- Firebase Authentication, Firestore, Firebase Storage fallback
- Cloudinary unsigned upload untuk media delivery
- Expo Camera, Expo Audio, Expo Video, Expo Image Picker
- Zustand untuk state management lokal

## Fitur Utama

- Login/register email password dan Google Sign-In
- Feed video/foto/audio dari Firestore dengan realtime listener
- Like, comment, save, share, follow/unfollow
- Profile dengan media, liked, commented, saved, followers, following
- Create media: record video, take photo, record audio, dan upload dari galeri
- Editor video/foto/audio sederhana: trim range UI, speed, volume, beauty, text overlay, filter
- Camera tools: flash, timer, filter warna, sticker overlay
- Notification sederhana untuk follow, like, comment, save, mention
- Dark/light theme, offline cache dasar, dan upload progress
- Animasi Reanimated: like heart pop, editor toolbar transition, comment sheet slide/fade
- Gesture Handler: double-tap to like di feed dan drag text overlay di editor video

## Instalasi

```bash
npm install
```

Pastikan EAS CLI tersedia jika ingin build APK:

```bash
npm install -g eas-cli
```

## Konfigurasi Environment

Buat file `.env` dari `.env.example`, lalu isi value Firebase, Google OAuth, dan Cloudinary.

```bash
cp .env.example .env
```

Variabel yang dibutuhkan:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_WEB_CLIENT_ID=
EXPO_PUBLIC_ANDROID_CLIENT_ID=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Untuk Google Sign-In Android, letakkan `google-services.json` di root project dan pastikan package Android di Firebase sama dengan `com.kelompok3.medianova`.

## Menjalankan App

Development server:

```bash
npm run start
```

Android development:

```bash
npm run android
```

Lint:

```bash
npm run lint
```

Export bundle Android untuk cek Metro:

```bash
npx expo export --platform android
```

Build APK preview:

```bash
npx eas build --profile preview --platform android
```

Build APK development client:

```bash
npx eas build --profile development --platform android
```

## Dokumentasi

- Technical Documentation: `docs/TECHNICAL_DOCUMENTATION.md`
- User Manual: `docs/USER_MANUAL.md`

## Upload Notes

- Upload video sebaiknya MP4.
- Sumber video maksimal 720p jika memungkinkan.
- Target video bitrate adalah 2 Mbps sebelum diupload.
- Firebase Storage fallback menggunakan `uploadBytesResumable`.
- Cloudinary digunakan untuk URL delivery media agar feed/profile bisa menampilkan video, foto, dan audio dari URL publik.
