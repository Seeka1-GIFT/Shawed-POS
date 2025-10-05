# Render Deployment Environment Variables

When deploying to Render, set these environment variables:

## Frontend Environment Variables:
- `VITE_API_URL`: `https://shawed-pos-backend.onrender.com/api`

## Backend Environment Variables (already configured in render.yaml):
- `NODE_ENV`: `production`
- `PORT`: `5000`
- `DATABASE_URL`: (automatically set from database)
- `JWT_SECRET`: (automatically generated)
- `CORS_ORIGIN`: `https://shawed-pos-frontend.onrender.com`
