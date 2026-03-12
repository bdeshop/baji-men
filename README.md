 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index 9ae1be93ab7ee94fbbe3e1caddd69eeb41221831..70227111465f966513930cd8498250965ae37c29 100644
--- a/README.md
+++ b/README.md
@@ -1,41 +1,54 @@
 # Full complete install + live run
 
-## GitHub quick start
+## GitHub install system (one command)
+
+```bash
+./scripts/github-install-system.sh
+```
+
+This will:
+1. Clone or pull `https://github.com/dsfsdsdsdfs/baj.git` into `./baj`.
+2. Run full install + live startup.
+
+## Direct GitHub quick start
 
 ```bash
 git clone https://github.com/dsfsdsdsdfs/baj.git
 cd baj
 npm run full:live
 ```
 
-This is the **full complete install live** command:
-1. Installs dependencies for `backend`, `client`, `admin`, `affiliate`, and `superaffiliate`.
-2. Starts all apps in live/dev mode.
-
 ## Useful commands
 
 Install everything only:
 
 ```bash
 npm run install:all
 ```
 
 Run live only (after install):
 
 ```bash
 npm run live
 ```
 
-Show help:
+Run GitHub installer from npm:
+
+```bash
+npm run github:install:live
+```
+
+Show script help:
 
 ```bash
-npm run full:live -- --help
+./scripts/full-install-live.sh --help
+./scripts/github-install-system.sh --help
 ```
 
 ## Live ports
 
 - Client: `5173`
 - Admin: `5174`
 - Affiliate: `5175`
 - Superaffiliate: `5176`
 - Backend: uses its default configured port (from backend config/env)
 
EOF
)
