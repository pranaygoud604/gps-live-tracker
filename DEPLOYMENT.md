# Balaji Fleet Tracker — Production Deployment Guide

## What Was Built

| Artifact | File | Size |
|---|---|---|
| Driver APK | `Balaji-Driver-v1.0-release.apk` | 1.6 MB |
| Admin APK | `Balaji-Admin-v1.0-release.apk` | 1.3 MB |
| Backend | `backend/dist/` | Node.js production build |
| Frontend | `frontend/dist/` | 15 optimized chunks ~750 KB |

---

## Part 1 — Install APKs on Android Devices

### Driver phones

1. Copy `Balaji-Driver-v1.0-release.apk` to the driver's phone (USB, WhatsApp, etc.)
2. On the phone: **Settings → Install unknown apps** → allow the source you used
3. Tap the APK file to install
4. Open **Balaji Driver** → allow Location permission (choose "Always" for background tracking)
5. Login with the driver credentials from `backend/data/drivers.json`

### Admin phones / tablets

1. Copy `Balaji-Admin-v1.0-release.apk` to the admin device
2. Install same way as above
3. Open **Balaji Fleet Admin** → login with `admin / Admin@123`

### Keystore — KEEP SAFE

| File | Password |
|---|---|
| `android-driver/android/app/driver-release.keystore` | `Balaji@2024` |
| `android-admin/android/app/admin-release.keystore` | `Balaji@2024` |

**Back these up. You cannot update the APK without the same keystore.**

---

## Part 2 — Run Backend Server

### Option A — Local / LAN (for testing)

```bash
cd backend
npm install
npm run build
node dist/index.js
```

Server listens on `http://0.0.0.0:3001`. Drivers and admins on the same WiFi network
can reach it at `http://<your-PC-IP>:3001`.

### Option B — Production VPS (recommended)

#### Prerequisites
- Ubuntu 22.04 VPS (DigitalOcean, Hetzner, etc.) — cheapest ~$4/month
- Domain name pointed at the VPS IP

#### 1. Install dependencies on VPS

```bash
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

#### 2. Upload backend

```bash
scp -r backend/ user@your-vps:/srv/balaji/
ssh user@your-vps
cd /srv/balaji/backend
npm install --production
npm run build
```

#### 3. Start with PM2

```bash
pm2 start dist/index.js --name balaji-backend
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

#### 4. Nginx config

Copy `nginx/nginx.conf` to `/etc/nginx/sites-available/balaji` then:

```bash
# Edit the file — replace YOUR_DOMAIN with your actual domain
sudo nano /etc/nginx/sites-available/balaji

sudo ln -s /etc/nginx/sites-available/balaji /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL (free via Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com
```

Auto-renewal is set up automatically by certbot.

#### 6. Upload frontend

```bash
scp -r frontend/dist/ user@your-vps:/var/www/balaji/
```

The Nginx config already serves `/var/www/balaji/` on port 443.

---

## Part 3 — Configure APKs to point at your server

The APKs built here load the frontend from the bundled web assets (`../frontend/dist`).
When running purely offline/LAN, you need the backend URL baked into the frontend.

### Update backend URL in frontend

Edit `frontend/src/services/api.ts` and `frontend/src/services/socket.ts` — change:
```
VITE_API_URL=http://localhost:3001
```
to your actual server URL, then rebuild:

```bash
cd frontend
echo "VITE_API_URL=https://your-domain.com" > .env.production
npm run build
```

Then rebuild the APKs (see Part 4).

---

## Part 4 — Rebuild APKs after any frontend change

```bash
# 1. Rebuild frontend
cd frontend && npm run build

# 2. Sync both Capacitor projects
cd ../android-driver && npx cap sync android
cd ../android-admin  && npx cap sync android

# 3. Build Driver APK
cd android-driver/android
set DRIVER_STORE_PASSWORD=Balaji@2024
set DRIVER_KEY_PASSWORD=Balaji@2024
.\gradlew.bat assembleRelease

# 4. Build Admin APK
cd ../../android-admin/android
set ADMIN_STORE_PASSWORD=Balaji@2024
set ADMIN_KEY_PASSWORD=Balaji@2024
.\gradlew.bat assembleRelease

# 5. Find APKs at:
#    android-driver\android\app\build\outputs\apk\release\app-release.apk
#    android-admin\android\app\build\outputs\apk\release\app-release.apk
```

---

## Default Credentials

### Drivers (password same for all: `Driver@123`)

| Name | Driver ID | Vehicle |
|---|---|---|
| Ravi Kumar | DRV001 | AP09AB1234 |
| Suresh Reddy | DRV002 | TS07CD5678 |
| Mahesh Naidu | DRV003 | AP28EF9012 |
| Venkat Rao | DRV004 | TS09GH3456 |
| Kiran Babu | DRV005 | AP05IJ7890 |
| Prasad Goud | DRV006 | TS11KL2345 |
| Srinivas | DRV007 | AP16MN6789 |
| Ramesh | DRV008 | TS22OP0123 |
| Naresh | DRV009 | AP39QR4567 |
| Sekhar | DRV010 | KA05ST7890 |

### Admin
| Username | Password |
|---|---|
| admin | Admin@123 |

**Change admin password** in `backend/data/drivers.json` before going to production.

---

## Architecture

```
Android Driver App  ─┐
Android Admin App   ─┤──► HTTPS ──► Nginx ──► Node.js (Port 3001)
Browser (any device)─┘                            │
                                              Socket.IO
                                          (real-time GPS events)
```

- **No database** — all sessions are in-memory. Restarting the backend logs everyone out.
- **Map tiles** — OpenStreetMap via CARTO (free, no API key required).
- **GPS updates** — sent every 5 seconds from driver app over WebSocket.

---

## Release Checklist

- [ ] Changed admin password in `backend/data/drivers.json`
- [ ] Set `VITE_API_URL` to production domain in `frontend/.env.production`
- [ ] Rebuilt frontend with production URL
- [ ] Synced Capacitor: `npx cap sync android` in both android-driver and android-admin
- [ ] Built signed release APKs
- [ ] Verified APKs with `apksigner verify`
- [ ] Backed up both `.keystore` files securely
- [ ] Backend running under PM2 on VPS
- [ ] SSL certificate installed
- [ ] Nginx serving frontend on 443
- [ ] Tested driver login → GPS tracking → admin map shows live position
- [ ] Tested emergency button on driver app → admin receives alert
