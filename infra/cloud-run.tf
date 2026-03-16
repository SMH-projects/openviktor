# Service account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "openviktor-bot"
  display_name = "OpenViktor Bot"
}

# Grant Cloud SQL client role
resource "google_project_iam_member" "cloud_run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Artifact Registry repository
resource "google_artifact_registry_repository" "bot" {
  location      = var.region
  repository_id = "openviktor"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Cloud Run service
resource "google_cloud_run_v2_service" "bot" {
  name     = "openviktor-bot"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/openviktor/bot:latest"

      ports {
        container_port = 3001
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 3001
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 3001
        }
        period_seconds = 30
      }

      # Non-secret environment variables
      env {
        name  = "DEPLOYMENT_MODE"
        value = "managed"
      }
      env {
        name  = "DEFAULT_MODEL"
        value = "gemini-2.5-flash"
      }
      env {
        name  = "BASE_URL"
        value = "https://${var.domain}"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "LOG_LEVEL"
        value = "info"
      }
      env {
        name  = "TOOL_GATEWAY_PORT"
        value = "3001"
      }
      env {
        name  = "ENABLE_DASHBOARD"
        value = "true"
      }
      env {
        name  = "GLOBAL_MONTHLY_BUDGET_CENTS"
        value = "5000"
      }

      # Secrets from Secret Manager
      env {
        name = "SLACK_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["slack-client-id"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SLACK_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["slack-client-secret"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SLACK_SIGNING_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["slack-signing-secret"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SLACK_STATE_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["slack-state-secret"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["encryption-key"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GOOGLE_AI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["google-ai-api-key"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["database-url"].secret_id
            version = "latest"
          }
        }
      }
    }

    service_account = google_service_account.cloud_run.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    timeout = "300s"
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.bot,
  ]
}

# Allow unauthenticated access (Slack needs to POST to it)
resource "google_cloud_run_v2_service_iam_member" "public" {
  location = google_cloud_run_v2_service.bot.location
  name     = google_cloud_run_v2_service.bot.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Domain mapping
resource "google_cloud_run_domain_mapping" "api" {
  location = var.region
  name     = var.domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.bot.name
  }
}
