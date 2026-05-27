# 🔐 Role Access Workbench (Monorepo Setup)

An advanced, premium-tier single-page application built with **Angular 20** (Frontend) and a **TypeScript Node.js API** (Backend). The repository is fully segregated into standalone `frontend` and `backend` services for seamless hosting.

---

## 🎨 System Architecture & Deployment

The application is structured as a segregated monorepo:

```
├── backend/            # Express TypeScript API (Hosted on Render)
└── frontend/           # Angular 20 SPA (Hosted on Vercel)
```

---

## ☁️ Deployment Instructions

### 1. Backend Service — Deploy to **Render**
The backend Express server compiles TypeScript, manages XML file-based storage, and processes core user sessions and audit logging.

1. Create a free account on **[Render.com](https://render.com/)**.
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Click **Deploy Web Service** and copy your live backend URL (e.g., `https://role-access-backend.onrender.com`).

---

### 2. Frontend Service — Deploy to **Vercel**
The frontend Angular SPA serves the beautiful client-side views and user directory.

1. Create a free account on **[Vercel.com](https://vercel.com/)**.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Edit the **[`frontend/vercel.json`](frontend/vercel.json)** file in your repository:
   * Replace `https://your-backend-url.onrender.com` with your **actual live Render backend URL** copied in the previous step.
5. In the Vercel dashboard, configure the following:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Angular`
   * **Build Command**: `npm install && npm run build`
   * **Output Directory**: `dist/role-access-workbench/browser` (Vercel automatically detects this)
6. Click **Deploy**. Vercel will build your Angular app and use the rewrite rule inside `vercel.json` to proxy all `/api/...` requests straight to your live Render backend without any CORS configuration!

---

## 👥 Demo Accounts & Credentials

| Role | User ID | Password | Access Rights |
|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin123` | Full access to records, full user management CRUD, audit logs, employee profiles, and **sole authorization to change user roles**. |
| **Admin** | `admin` | `admin123` | Full access to records, user management CRUD (details only, roles disabled), audit logs, and employee performance profiles. |
| **General User** | `general` | `general123` | Scoped read access (can only view owned records plus public records). |
| **General User** | `analyst` | `analyst123` | Scoped read access (can only view owned records plus public records). |
