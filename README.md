# Balaji Fleet Tracker

**Enterprise-grade Live GPS Fleet Tracking — 100% Free & Open Source**

Real-time fleet tracking for Balaji Readymix using OpenStreetMap, Socket.IO, and React. No paid APIs, no subscriptions, no hidden costs.

---

## Architecture

```
Gps-Live Tracker/
├── backend/          Node.js + Express + Socket.IO + TypeScript
├── frontend/         React + Vite + TypeScript + TailwindCSS + Leaflet
├── nginx/            Production reverse proxy config
├── docker-compose.yml
└── .env.example
```

---

## Tech Stack (100% Free)

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express 4, Socket.IO 4, TypeScript |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Maps | OpenStreetMap + Leaflet + CARTO tiles |
| Frontend | React 18, Vite 5, TailwindCSS 3, Framer Motion |
| State | Zustand, TanStack Query |
| Proxy | Nginx |
| Process | PM2 |
| SSL | Let's Encrypt (Certbot) |
| Container | Docker + Docker Compose |

---

## Quick Start (Development)

### 1. Clone and setup

```bash
cd "Gps-Live Tracker"
cp .env.example .env
# Edit .env — change JWT_SECRET and passwords
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Starts on http://localhost:5173
```

### 4. Login

| Role | Field | Value |
|------|-------|-------|
| Admin | Username | `admin` |
| Admin | Password | `Admin@Balaji2024` |
| Driver | Vehicle No. | `AP09AB1234` |
| Driver | Password | `Driver@123` |

---

## Driver Accounts (Predefined)

Edit `backend/data/drivers.json` to add/change drivers:

```json
{
  "drivers": [
    {
      "id": "drv001",
      "name": "Rajesh Kumar",
      "vehicleNumber": "AP09AB1234",
      "phone": "9876543210",
      "password": "Driver@123"
    }
  ]
}
```

Restart the backend after editing — passwords are hashed at startup.

---

## Production Deployment (Ubuntu VPS / Hostinger)

### Prerequisites

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin certbot
sudo usermod -aG docker $USER && newgrp docker
```

### 1. Upload project

```bash
scp -r "Gps-Live Tracker/" user@your-server:/opt/fleet-tracker/
```

### 2. SSL Certificate (Let's Encrypt — free)

```bash
sudo certbot certonly --standalone -d your-domain.com
```

### 3. Configure environment

```bash
cd /opt/fleet-tracker
cp .env.example .env
nano .env  # Set your domain, JWT_SECRET, admin password
```

Update `nginx/nginx.conf` — replace `your-domain.com` with your actual domain.

### 4. Deploy

```bash
docker compose up -d --build
```

### 5. Check status

```bash
docker compose ps
docker compose logs -f backend
```

---

## PM2 (Alternative — without Docker)

```bash
# Backend
cd backend
npm install && npm run build
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup

# Frontend — build and serve with Nginx
cd frontend
npm install && npm run build
# Copy dist/ to /var/www/html or Nginx root
```

---

## API Reference

### Authentication

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | `{vehicleNumber, password}` | Driver login |
| POST | `/api/auth/login` | `{username, password}` | Admin login |
| POST | `/api/auth/logout` | — | Logout |
| GET  | `/api/auth/me` | — | Current user |

### Fleet (Admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/drivers` | All driver sessions + stats |
| GET | `/api/drivers/online` | Online drivers only |
| GET | `/api/drivers/stats` | Fleet statistics |
| GET | `/api/drivers/list` | Master driver list |
| GET | `/health` | Server health check |

---

## WebSocket Events

### Driver → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `start_tracking` | — | Begin GPS broadcast |
| `stop_tracking` | — | Stop GPS broadcast |
| `location_update` | `{lat, lng, accuracy, speed, heading, altitude, timestamp, battery, network, address}` | GPS position |
| `heartbeat` | `{timestamp, battery, network}` | Keep-alive |
| `emergency` | `{message}` | Emergency alert |

### Server → Admin

| Event | Payload | Description |
|-------|---------|-------------|
| `driver_list` | `{sessions, stats, activityLog}` | Full fleet state |
| `driver_connected` | `{session, activity}` | Driver came online |
| `driver_disconnected` | `{session, activity}` | Driver went offline |
| `location_update` | `{driverId, location, battery, ...}` | Position update |
| `tracking_started` | `{session, activity}` | Tracking began |
| `tracking_stopped` | `{session, activity}` | Tracking stopped |
| `stats_update` | `FleetStats` | Updated counts |
| `emergency` | `{session, activity}` | Emergency alert |

---

## Map Tile Options (All Free)

| Style | URL |
|-------|-----|
| Dark (default) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |
| Street | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| Satellite | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |

Set via `VITE_TILE_URL` in `frontend/.env`

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a 64-character random string
- [ ] Change all driver passwords in `data/drivers.json`
- [ ] Change `ADMIN_PASSWORD`
- [ ] Set `CORS_ORIGIN` to your actual domain
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Review Nginx security headers
- [ ] Set `NODE_ENV=production`

---

## License

MIT — free for commercial use.

---

Built with Node.js, React, Socket.IO, OpenStreetMap & Leaflet.  
Zero paid dependencies. Zero vendor lock-in.
