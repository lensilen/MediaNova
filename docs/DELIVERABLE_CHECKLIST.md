# Deliverable Checklist - MediaNova

| No | Deliverable | Status | Lokasi / Catatan |
| --- | --- | --- | --- |
| 1 | Source Code GitHub publik dengan commit history | Siap | Repository GitHub, branch `main` dan `develop` |
| 2 | README instalasi, env, run app, screenshot fitur | Siap sebagian | `README.md`; screenshot perlu ditambahkan ke `assets/screenshots/` |
| 3 | Technical Documentation | Siap | `docs/TECHNICAL_DOCUMENTATION.md` |
| 4 | User Manual | Siap sebagian | `docs/USER_MANUAL.md`; screenshot perlu ditambahkan |
| 5 | APK Build atau Expo Go Link | Perlu dibuat | `npx eas build --profile preview --platform android` |
| 6 | Screen Recording Demo 3-4 menit | Perlu direkam | Ikuti `docs/DEMO_SCRIPT.md` |
| 7 | Presentasi maksimal 15 slide | Siap | `outputs/MediaNova_Presentation.pptx` |
| 8 | Deliverable spesifik kelompok | Siap sebagian | Video shorts, audio, camera filters ada; editor video/AR face tracking perlu dijelaskan sebagai limitasi |

## File Yang Perlu Kamu Tambahkan Manual

- Screenshot fitur utama di `assets/screenshots/`
- APK hasil EAS build atau link Expo/EAS
- Video screen recording demo 3-4 menit

## Command Build APK

```bash
npx eas build --profile preview --platform android
```

## Command Cek Sebelum Build

```bash
npm run lint
npx expo export --platform android
```
