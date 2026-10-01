# Campus Launch

## Start the app

Run the API and frontend in separate terminals from the project folder.

Terminal 1:

```powershell
cd server
npm run dev
```

Terminal 2:

```powershell
cd client
npm run dev
```

Open http://localhost:5173. The Vite development server forwards `/api` requests to the API on port 5000. The API reads `MONGO_URI` from `server/.env`; keep that file private.

## Verify a registration

Submit the student form with zero standing arrears and choose four companies. Open **Login** and enter the same student ID and email to retrieve the saved registration. The Admin view lists saved students and filters them by company.

The Login screen is a registration lookup, not password-based authentication. Add proper authentication and authorization before deploying student data publicly.