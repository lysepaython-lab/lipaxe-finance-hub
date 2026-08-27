# Deploy `lipaxe-finance-hub` on `web.lipaxe.com`

## 1. Build the production bundle

Create a production env file from the example:

```bash
cp .env.production.example .env.production
```

Adjust values if needed, then build:

```bash
npm install
npm run build:prod
```

The static bundle is generated in `dist/`.

## 2. Upload the bundle to the server

Recommended target:

```bash
/var/www/web.lipaxe.com/current
```

Example:

```bash
mkdir -p /var/www/web.lipaxe.com/current
rsync -av --delete dist/ /var/www/web.lipaxe.com/current/
```

## 3. Nginx host config

Create:

```bash
/etc/nginx/sites-available/web.lipaxe.com.conf
```

Use this config:

```nginx
server {
    listen 80;
    server_name web.lipaxe.com;

    root /var/www/web.lipaxe.com/current;
    index index.html;

    # The authenticated application, authentication forms, and tokenised payment
    # journeys must never be indexed, even before the SPA updates page metadata.
    location ~ ^/(app/|login$|register$|verify-email$|forgot-password$|reset-password$|pay/|launch$) {
        add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
        try_files $uri $uri/ /index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location = /favicon.ico {
        access_log off;
        expires 7d;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/web.lipaxe.com.conf /etc/nginx/sites-enabled/web.lipaxe.com.conf
nginx -t
systemctl reload nginx
```

## 4. Enable SSL

Once DNS points to the server:

```bash
certbot --nginx -d web.lipaxe.com
```

## 5. Important production values

The frontend must point to the backend API domain:

```bash
VITE_API_URL=https://api.lipaxe.com
```

The frontend host should be:

```bash
VITE_APP_HOST=web.lipaxe.com
```

SEO canonicals and social previews use this public origin. Set it explicitly in
the production environment if the domain changes:

```bash
VITE_SITE_URL=https://web.lipaxe.com
```

## 6. Runtime behavior

- API calls go to `https://api.lipaxe.com/api/v1/...`
- React Router routes are handled by the `try_files ... /index.html` fallback
- static assets are served directly by host nginx
- `/` is the public, indexable landing page; authenticated, auth, and payment-link routes return `X-Robots-Tag: noindex`
