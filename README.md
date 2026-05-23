# Role Access Workbench

Angular 12+ single-page application with a TypeScript Node.js API. The API uses a local XML file as dummy persistence so the app can demonstrate login, role-based access, async API delay, user records, and admin user management without external infrastructure.

## Demo Users

| Role | User ID | Password |
| --- | --- | --- |
| General User | `general` | `general123` |
| Admin | `admin` | `admin123` |

## Run

```bash
npm install
npm start
```

The Angular app runs at `http://127.0.0.1:4200` and proxies API calls to `http://127.0.0.1:3000`.

## Useful Scripts

```bash
npm run api
npm run client
npm run verify
```

## Architecture Notes

- `src/app/core/services/app-load.service.ts` restores an existing session with `APP_INITIALIZER` during application startup.
- `src/app/core/services/user.service.ts` owns the user/profile/records/admin API calls.
- `server/storage/xml-store.ts` reads and writes `server/data/users.xml` as the dummy database.
- Every authenticated API supports a `delay` query parameter to demonstrate asynchronous UI states.
- The storage layer is isolated behind `XmlStore`, so the API routes can be pointed at MongoDB or AWS DynamoDB by replacing that adapter without changing Angular services.
