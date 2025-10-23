/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SLACK_WEBHOOK_URL: string
  readonly VITE_SENDGRID_API_KEY: string
  readonly VITE_SENDGRID_FROM_EMAIL: string
  readonly VITE_APP_URL: string
  readonly VITE_VERCEL_URL: string
  readonly VITE_VERCEL_ENV: string
  readonly VITE_VERCEL_REGION: string
  readonly VITE_VERCEL_GIT_COMMIT_SHA: string
  readonly VITE_VERCEL_GIT_COMMIT_REF: string
  readonly VITE_VERCEL_GIT_REPO_OWNER: string
  readonly VITE_VERCEL_GIT_REPO_SLUG: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_ID: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_NUMBER: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_TITLE: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_LABELS: string
  readonly VITE_VERCEL_GIT_COMMIT_MESSAGE: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_NAME: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_EMAIL: string
  readonly VITE_VERCEL_GIT_COMMIT_SHA: string
  readonly VITE_VERCEL_GIT_COMMIT_REF: string
  readonly VITE_VERCEL_GIT_REPO_OWNER: string
  readonly VITE_VERCEL_GIT_REPO_SLUG: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_ID: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_NUMBER: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_TITLE: string
  readonly VITE_VERCEL_GIT_PULL_REQUEST_LABELS: string
  readonly VITE_VERCEL_GIT_COMMIT_MESSAGE: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_NAME: string
  readonly VITE_VERCEL_GIT_COMMIT_AUTHOR_EMAIL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
