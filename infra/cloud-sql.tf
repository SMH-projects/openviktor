# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "postgres" {
  name                = "openviktor-db"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = true

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = 10
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }

    maintenance_window {
      day  = 7 # Sunday
      hour = 4
    }
  }

  depends_on = [google_service_networking_connection.private_vpc]
}

resource "google_sql_database" "openviktor" {
  name     = "openviktor"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "openviktor" {
  name     = "openviktor"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
