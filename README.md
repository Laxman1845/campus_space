# Campus Space

Campus Space helps students find currently available rooms by selecting a building and floor.

## Requirements

- Node.js and npm
- Python 3.11+
- PostgreSQL

## Setup

### Frontend

```powershell
npm install
```

### Backend

Create and activate the virtual environment, then install Python dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Copy `.env.example` to `.env` and update the PostgreSQL connection values.

## Run Locally

Start the backend from the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Start the frontend in a second terminal:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Deploy

### Backend on Render

Create a Render PostgreSQL database, then create a Web Service from this repository.
Render can use `render.yaml`, or configure these values manually:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- `DATABASE_URL`: the internal connection URL from Render PostgreSQL
- `FRONTEND_URL`: the deployed Vercel URL, for example `https://campus-space.vercel.app` (the backend also permits Vercel preview URLs)

### Frontend on Vercel

Import the repository as a Vercel project. Use the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_BASE`: the Render backend URL, for example `https://campus-space-api.onrender.com`

Redeploy the frontend after setting `VITE_API_BASE`, since Vite embeds `VITE_*` values during the build.

Test the deployed backend before connecting the frontend by opening `https://<your-render-service>.onrender.com/health`; it should return `{"status":"ok"}`.

## Configuration

`VITE_API_BASE` controls the backend URL used by the frontend:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

The backend reads `DATABASE_URL`, or these PostgreSQL variables when it is not set:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=campusspace
```

## API

The frontend uses these backend endpoints:

- `GET /tables?building={name}&floor={number}`: list rooms available now
- `POST /tables`: create a free-room time slot

Location detection and backend floor discovery are not part of the current implementation. Buildings and floor options are selected from the frontend's local campus data.

## Validation

Build the frontend:

```powershell
npm run build
```

Compile the backend:

```powershell
python -m compileall backend
```
