# AETHERZYY Luau/Lua Obfuscator Discord Bot

Bot Discord siap dipasang untuk meng-obfuscate file `.lua` dan `.luau`.

## Fitur

- `/obfuscate`
- Upload `.lua` atau `.luau`
- Hapus komentar
- Encode string literal menjadi `string.char(...)`
- Rename sebagian `local` identifiers secara konservatif
- Output dikirim kembali sebagai file
- File diproses di memory, bukan disimpan ke disk
- Batas file default 2 MB

> Ini adalah lightweight source obfuscator, bukan VM/Luraph replacement. Selalu simpan source asli karena obfuscation dapat memengaruhi script yang memakai pola tertentu.

## Yang dibutuhkan

- Node.js 18+
- Bot Discord
- Application ID
- Bot Token

## Instalasi

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu isi:

```env
DISCORD_TOKEN=TOKEN_BOT_DISCORD
CLIENT_ID=APPLICATION_ID
GUILD_ID=SERVER_ID
MAX_FILE_MB=2
```

`GUILD_ID` boleh dikosongkan. Kalau diisi, command didaftarkan langsung ke server tersebut sehingga biasanya muncul lebih cepat.

Jalankan:

```bash
npm start
```

## Permission bot

Saat invite bot ke server, gunakan scope:

- `bot`
- `applications.commands`

Bot hanya membutuhkan izin mengirim pesan/attachment dan menggunakan slash commands.

## Cara pakai

Di Discord:

```text
/obfuscate
```

Kemudian upload:

```text
script.lua
```

Bot akan mengembalikan:

```text
script_obfuscated.lua
```

## Catatan Roblox

Untuk ModuleScript, pastikan `return` tetap berada di source. Setelah obfuscation, test dulu di Roblox Studio.

Jangan mengandalkan obfuscation sebagai pengganti keamanan server. RemoteEvent, DataStore, validasi transaksi, dan logic penting sebaiknya tetap divalidasi server-side.
