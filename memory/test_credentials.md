# Test Credentials — fabrika.flo

## Backend
- URL: `http://127.0.0.1:3000/api/fabrika`
- Health probe: `GET /api/fabrika/gallery` (returns list of portfolio items)

## Admin login (JWT via `POST /api/fabrika/auth/login`)
- **login**: `rom`
- **password**: `admin123`
- Role: `ADMIN`
- User ID: `d3a06ccd-2dca-47b3-aac8-a14b6ef950e0`
- Name: `Kit`

Second admin (has_pass=true but unknown password):
- login: `krutkris` (do not use — password unknown)

## Webapp (Vite dev-server)
- URL: `http://127.0.0.1:5173/webapp/`
- Proxy: any `/api/fabrika/*` from webapp is forwarded to backend on `:3000`

## Database (Postgres 15)
- Host: `localhost:5432`
- DB: `fabrika_db`
- User: `fabriks_user`
- Password: `c20d2e2b2dab2d300ea60b906ceb0062`

## How to obtain a bearer token
```
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/fabrika/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"rom","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
```
Then pass `Authorization: Bearer $TOKEN` to protected routes.

## Frontend auth unlock
The webapp uses `localStorage['auth_token']` to satisfy `ProtectedRoute`. Setting any string
will unlock the client routes for UI testing. To pass real API auth via the bearer scheme, set
it to the JWT returned by `/auth/login`.

## Seed data
- 5 gallery items (portfolio bouquets, real Cloudinary URLs)
- Several clients + 1 request + 1 order with photos
- 2 admin users (see above)
