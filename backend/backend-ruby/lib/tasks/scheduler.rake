namespace :rent do
  desc "Enqueue rent reminder job"
  task reminders: :environment do
    RentReminderJob.perform_async
  end
end


