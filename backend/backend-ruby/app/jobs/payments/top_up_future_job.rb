module Payments
  class TopUpFutureJob
    include Sidekiq::Job

    QUEUE = "payments".freeze
    sidekiq_options queue: QUEUE

    # Ensures each tenant has scheduled payments up to today + 90 days
    def perform
      today = Date.current
      horizon = today + 90.days

      tenants_scope = ::Tenant.where("lease_start IS NOT NULL")
                               .where("lease_end IS NULL OR lease_end >= ?", today)

      tenants_scope.find_each(batch_size: 500) do |tenant|
        begin
          start_on = next_generation_start_on(tenant)
          next if start_on.nil?

          end_on = [tenant.lease_end.presence || horizon, horizon].compact.min
          next if end_on < start_on

          Payments::ScheduleGenerator.call(
            tenant: tenant,
            start_on: start_on,
            end_on: end_on
          )
        rescue => e
          Rails.logger.error("TopUpFutureJob error for tenant #{tenant.id}: #{e.class} #{e.message}")
        end
      end
    end

    private

    def next_generation_start_on(tenant)
      return nil unless tenant.lease_start.present?

      last_due_date = ::Payment.where(tenant_id: tenant.id).maximum(:due_date)

      if last_due_date.present?
        target_month = Date.new(last_due_date.year, last_due_date.month, 1).next_month
      else
        # Onboarding assumption: when first registering, start from max(lease_start, today)
        first_month = Date.new(tenant.lease_start.year, tenant.lease_start.month, 1)
        cutoff = Date.new(today.year, today.month, 1)
        target_month = [first_month, cutoff].max
      end

      clamp_day_of_month(target_month.year, target_month.month, tenant.lease_start.day)
    end

    def clamp_day_of_month(year, month, desired_day)
      last_day = Date.civil(year, month, -1).day
      day = [desired_day, last_day].min
      Date.civil(year, month, day)
    end
  end
end


