namespace :rent do
  desc "Enqueue rent reminder job"
  task reminders: :environment do
    RentReminderJob.perform_async
  end
end

namespace :payments do
  desc "Ensure payments exist up to today + 90 days"
  task top_up_future: :environment do
    Payments::TopUpFutureJob.perform_async
  end
end

# Cron example (system crontab or container scheduler):
# 0 6 * * * cd /app && bundle exec rake payments:top_up_future


