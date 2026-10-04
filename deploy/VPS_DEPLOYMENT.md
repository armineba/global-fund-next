# Déploiement effectué sur le VPS

- URL : https://global-fund-next.213.199.40.67.sslip.io
- Sources : `/home/codex/projects/global-fund-next`
- Service : `/etc/systemd/system/global-fund-next.service`, activé au démarrage, redémarrage automatique.
- Écoute privée : `127.0.0.1:3101`.
- Proxy : `/etc/nginx/sites-available/global-fund-next.conf`, lien dédié dans `sites-enabled`.
- Certificat : `/etc/letsencrypt/live/global-fund-next.213.199.40.67.sslip.io/`, renouvellement Certbot/webroot. Le chemin ACME HTTP est conservé dans le nouvel hôte.
- Stockage : PostgreSQL 16 existant, base et rôle applicatif dédiés `global_fund_next`. Les autres bases restent séparées.
- Configuration privée : `.env`, permissions `0600`, ignoré par Git ; chargée par systemd et les commandes locales. Aucun secret dans ces documents.

## Commandes de maintenance

```sh
npm ci
npm run build
npm test
npm run test:e2e
sudo systemctl restart global-fund-next.service
sudo systemctl status global-fund-next.service
curl -fsS https://global-fund-next.213.199.40.67.sslip.io/health
sudo journalctl -u global-fund-next.service -n 50
```

Le service applique la migration SQL idempotente avant son démarrage. Les salons sont sauvés avant diffusion des commandes ; les jetons de session sont stockés sous forme d'empreintes. Une reprise après redémarrage a été vérifiée avec une transaction réelle. Le navigateur doit conserver sa session locale pour reprendre sa place.

Le service de référence `global-fund.service`, son port 3001, son hôte et ses fichiers ne sont pas modifiés par ces opérations. Le manifeste d'intégrité de ses sources figure dans `docs/reference-integrity.json`. Ne lancez pas ces commandes depuis son répertoire.

Compose et les exemples génériques sous `/opt/` sont des alternatives documentées dans README.md ; le VPS utilise actuellement le répertoire et le compte `codex` ci-dessus. La scène reste prévue pour un seul processus serveur autoritaire. L'automatisation des sauvegardes et la restauration font partie de la prochaine étape de fiabilité.
