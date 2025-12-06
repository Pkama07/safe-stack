# safe-stack

## Local HTTP/3 reverse proxy (Caddy)

Browsers decide the protocol based on what the server advertises. This project ships a Caddy config to terminate TLS and serve HTTP/3 in front of Next (which stays on port 3000).

Steps:
1) Install Caddy (macOS: `brew install caddy`, Debian/Ubuntu: `sudo apt install caddy` or use the official script).  
2) Start Next normally in another shell: `npm run dev`.  
3) From the repo root run `caddy run --config proxy/Caddyfile`. This binds `https://localhost:443`, advertises `Alt-Svc` for H3, and proxies to `127.0.0.1:3000`.  
4) The cert is self-signed. In Chrome/Edge/Safari, visit `https://localhost`, proceed through the warning once, or run `caddy trust` (may require sudo) to add the CA.  
5) Verify in DevTools → Network → `Protocol` column shows `h3` (or `h2` fallback).

Notes:
- Caddy keeps HTTP/1.1/2 as fallbacks automatically, so older clients still work.  
- If you prefer Docker, run Caddy in host network mode so it can reach `127.0.0.1:3000`, or adjust `reverse_proxy` to the reachable host.  
- For production, use an edge/proxy that supports HTTP/3 (Cloudflare, AWS ALB/NLB with UDP+QUIC, Envoy, Caddy, or nginx-quic) and forward to your Next server.
