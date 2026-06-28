# Deployment

Use Render for the Django API and PostgreSQL database. Use Netlify for the React frontend.

## 1. Push This Folder To GitHub

Render and Netlify both deploy from a Git repository.

## 2. Deploy Backend And Database On Render

1. In Render, create a new Blueprint from this repository.
2. Render will read `render.yaml`.
3. It creates:
   - `mess-admission-api`
   - `mess-admission-db`
4. After deploy, copy the backend URL. It will look like:

```text
https://mess-admission-api.onrender.com
```

If you renamed the Render service, update these Render environment variables:

```text
ALLOWED_HOSTS=your-api-name.onrender.com
CSRF_TRUSTED_ORIGINS=https://your-api-name.onrender.com,https://your-netlify-site.netlify.app
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
```

## 3. Create Admin User On Render

Open the Render service shell and run:

```bash
python manage.py createsuperuser
```

## 4. Deploy Frontend On Netlify

Use these Netlify settings:

```text
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

Add this Netlify environment variable:

```text
VITE_API_BASE_URL=https://your-api-name.onrender.com/api
```

After Netlify gives you the site URL, update Render:

```text
CORS_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-api-name.onrender.com,https://your-netlify-site.netlify.app
```

Redeploy both services after changing environment variables.
