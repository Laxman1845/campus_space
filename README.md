# Campus Space

Campus Space helps students find currently available rooms by selecting a building and floor.

## Requirements

- Node.js and npm
- Python 3.11+
- A PostgreSQL database

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

Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.

Make sure PostgreSQL is running before starting the API. The frontend cannot connect directly to PostgreSQL; it connects to FastAPI on port `8000`.

## Run Locally

Start the backend from the project root:

```powershell
npm run dev:backend
```

Start the frontend in a second terminal:

```powershell
npm run dev
```

Keep both terminals running. If the frontend shows `Failed to fetch`, open `http://127.0.0.1:8000/health`; it must return `{"status":"ok"}`. That error means the API is stopped, the API URL is wrong, or the browser is blocked from reaching the API.

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Deploy

### Backend on Render

Create a Render Web Service from this repository. Configure these values manually or use `render.yaml`:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- `FRONTEND_URL`: the deployed Vercel URL, for example `https://campus-space.vercel.app` (the backend also permits Vercel preview URLs)
- `DATABASE_URL`: the PostgreSQL connection string

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

The backend uses PostgreSQL through SQLAlchemy. Configure either a complete connection string:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/campusspace
```

Or configure `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, and `POSTGRES_DB` individually.

## API

The frontend uses these backend endpoints:

- `GET /tables?building={name}&floor={number}&time={HH:MM:SS}&day={weekday}`: list rooms available for the requested day and time
- `POST /tables`: create a free-room time slot including its weekday in `day`

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
