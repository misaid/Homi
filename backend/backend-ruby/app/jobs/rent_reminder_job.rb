class RentReminderJob
  include Sidekiq::Job

  QUEUE = "rent-reminders".freeze
  sidekiq_options queue: QUEUE

  def perform
    target_date = Date.today + 3.days
    payments = Payment.where(status: "due", due_date: target_date)
    payments.find_each do |payment|
      # Here you could send emails/notifications; for now, just log
      Rails.logger.info("Rent reminder for payment #{payment.id} tenant #{payment.tenant_id} due #{payment.due_date}")
    end
  end
end


