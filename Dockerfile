# ── Stage 1 : build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Les variables VITE_* sont baked dans le bundle au moment du build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN npm run build

# ── Stage 2 : serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
