# Campus Space

Campus Space helps students find currently available rooms by selecting a building and floor.

## Requirements

- Node.js and npm
- Python 3.11+
- A MongoDB Atlas database

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

For the frontend, copy `frontend/.env.example` to `frontend/.env`; it contains only `VITE_API_BASE`.

For the backend, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to your MongoDB Atlas connection string.

Make sure MongoDB is reachable before starting the API. The frontend cannot connect directly to MongoDB; it connects to FastAPI on port `8000`.

## Run Locally

Start the backend from the backend folder:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Start the frontend from the frontend folder in a second terminal:

```powershell
cd frontend
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
- `MONGODB_URI`: the MongoDB Atlas connection string
- `MONGODB_DB`: the database name, normally `campus_space`

Create a MongoDB Atlas cluster and database user, then copy its connection string into the API service's `MONGODB_URI` environment variable. Do not commit this URL to `.env`, `.env.example`, or source code. In MongoDB Atlas, add Render's outbound IP addresses to Network Access, or use `0.0.0.0/0` temporarily for testing. The API creates and uses the collection named by `MONGODB_COLLECTION`, normally `campus`, when requests arrive.

After the API deploys, verify `https://<your-render-service>.onrender.com/health` returns `{"status":"ok"}`. Then set the frontend's `VITE_API_BASE` to that API URL and redeploy the Vercel frontend, because Vite embeds this value during the build.

### Frontend on Vercel

Import the repository as a Vercel project. Use the default Vite settings:

- Root directory: repository root (the folder containing `package.json`)
- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_BASE`: the Render backend URL, for example `https://campus-space-api.onrender.com`

Redeploy the frontend after setting `VITE_API_BASE`, since Vite embeds `VITE_*` values during the build.

Test the deployed backend before connecting the frontend by opening `https://<your-render-service>.onrender.com/health`; it should return `{"status":"ok"}`.

### Folder ownership

- Frontend: `main.jsx`, `campus_space (1) (1).jsx`, `index.html`, `package.json`, `package-lock.json`, `vercel.json`, and the repository-root `.env`
- Backend: `backend/main.py`, `backend/database.py`, `backend/.env`, `requirements.txt`, and `render.yaml`
- Never commit either `.env` file. Both are ignored by Git.

## Configuration

`VITE_API_BASE` controls the backend URL used by the frontend:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

The backend uses MongoDB through PyMongo. Configure the Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=campus_space
MONGODB_COLLECTION=campus
```

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
