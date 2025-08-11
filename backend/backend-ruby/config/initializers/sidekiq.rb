require "sidekiq"

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://redis:6379/0") }
  # If using sidekiq-cron, you can load schedule here:
  # schedule = {
  #   "payments_top_up_future" => {
  #     "cron" => "0 6 * * *",
  #     "class" => "Payments::TopUpFutureJob",
  #     "queue" => "payments"
  #   }
  # }
  # require "sidekiq/cron/job"
  # Sidekiq::Cron::Job.load_from_hash schedule
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://redis:6379/0") }
end


