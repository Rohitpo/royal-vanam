# Backup guide

## Database backups

Use automated Supabase database backups and point-in-time recovery for production. Store retention policies should be tailored to business continuity requirements.

## Recommended process

- Daily automated backups from Supabase
- Weekly export of key table snapshots
- Version-controlled SQL migrations in git
- Offsite archival of exported CSV and invoice reports
- Quarterly restore testing

## Operational recommendations

- Keep backups encrypted
- Validate before and after major releases
- Store export artifacts in a separate storage bucket
- Retain audit logs for financial and order histories
