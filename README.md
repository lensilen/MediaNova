# MediaNova

## Upload Notes

- Upload video inputnya MP4 
- Sumber video maksimal 720p jika memungkinkan.
- Target video bitrate adalah 2 Mbps sebelum diupload.
- Firebase Storage upload menggunakan `uploadBytesResumable`, sehingga file yang lebih besar dari 10 MB menggunakan menggunakan upload path yang sama dengan callback progres.
