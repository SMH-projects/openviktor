# Secret Manager secrets for sensitive environment variables
locals {
  secrets = [
    "slack-client-id",
    "slack-client-secret",
    "slack-signing-secret",
    "slack-state-secret",
    "encryption-key",
    "google-ai-api-key",
    "database-url",
  ]
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(local.secrets)
  secret_id = "openviktor-${each.value}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# Grant Cloud Run service account access to secrets
resource "google_secret_manager_secret_iam_member" "cloud_run_access" {
  for_each  = toset(local.secrets)
  secret_id = google_secret_manager_secret.secrets[each.value].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
