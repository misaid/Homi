module Payments
  class GenerateScheduleJob
    include Sidekiq::Job

    QUEUE = "payments".freeze
    sidekiq_options queue: QUEUE

    # Arguments should be primitives for Sidekiq
    # perform(tenant_id, start_on_string, end_on_string)
    def perform(tenant_id, start_on_str = nil, end_on_str = nil)
      tenant = ::Tenant.find_by(id: tenant_id)
      return unless tenant

      start_on = parse_date(start_on_str) || tenant.lease_start
      end_on = parse_date(end_on_str) || tenant.lease_end

      Payments::ScheduleGenerator.call(
        tenant: tenant,
        start_on: start_on,
        end_on: end_on,
        horizon_days: 90
      )
    end

    def self.enqueue(tenant_id:, start_on:, end_on:)
      perform_async(tenant_id, start_on&.to_s, end_on&.to_s)
    end

    private

    def parse_date(str)
      return nil if str.nil?
      Date.parse(str)
    rescue ArgumentError
      nil
    end
  end
end


