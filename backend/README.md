# ParkOptima Python Backend

This backend provides a Python FastAPI service for the frontend app and connects to the `parkoptima_db` database.

## Setup

1. Create the database and tables using the schema:

   ```bash
   mysql -u root -p < backend/schema.sql
   ```

2. Set the database environment variables if needed:

   - `DB_HOST`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`

3. Install Python dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

4. Start the FastAPI server:

   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

5. The frontend already targets `http://10.0.2.2:8001` for Android emulation.

## Implemented API routes

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/vehicle-login`
- `POST /api/vehicle/register`
- `GET /api/monitor/summary`
- `GET /api/vehicles/balance?plate={plate}`
- `GET /api/users/{id}`
- `GET /api/ping`
- `POST /api/vision/detect`

## Notes

- Passwords and PINs are verified using a salted SHA-256 hash.
- The backend uses MySQL Connector with FastAPI and Uvicorn.
- For production, use a proper authentication token flow and secure HTTPS.
