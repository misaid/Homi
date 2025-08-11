module Payments
  class ScheduleGenerator
    Result = Struct.new(:created, :skipped, :updated, keyword_init: true)

    def self.call(tenant:, start_on:, end_on:, horizon_days: 90)
      new(tenant: tenant, start_on: start_on, end_on: end_on, horizon_days: horizon_days).call
    end

    def initialize(tenant:, start_on:, end_on:, horizon_days: 90)
      @tenant = tenant
      raw_start = to_date(start_on)
      raw_end = to_date(end_on)
      today = Date.current
      @start_on = raw_start.present? ? [raw_start, today].max : today
      default_horizon = today + horizon_days.to_i.days
      @end_on = raw_end.present? ? raw_end : default_horizon
    end

    def call
      return Result.new(created: 0, skipped: 0, updated: 0) if @start_on.nil? || @end_on.nil?
      return Result.new(created: 0, skipped: 0, updated: 0) if @end_on < @start_on

      created_count = 0
      skipped_count = 0

      month_cursor = Date.new(@start_on.year, @start_on.month, 1)
      last_month = Date.new(@end_on.year, @end_on.month, 1)

      while month_cursor <= last_month
        due_date = clamp_day_of_month(month_cursor.year, month_cursor.month, @start_on.day)
        # Never create past-due rows
        if due_date < Date.current
          month_cursor = month_cursor.next_month
          next
        end
        if payment_exists?(due_date)
          skipped_count += 1
        else
          create_payment!(due_date)
          created_count += 1
        end

        month_cursor = month_cursor.next_month
      end

      Result.new(created: created_count, skipped: skipped_count, updated: 0)
    end

    private

    def to_date(value)
      return nil if value.nil?
      return value.to_date if value.respond_to?(:to_date)
      Date.parse(value.to_s)
    end

    def clamp_day_of_month(year, month, desired_day)
      last_day = Date.civil(year, month, -1).day
      day = [desired_day, last_day].min
      Date.civil(year, month, day)
    end

    def payment_exists?(due_date)
      ::Payment.exists?(tenant_id: @tenant.id, due_date: due_date)
    end

    def determine_amount!
      amount = @tenant.rent_amount.presence || @tenant.unit&.monthly_rent
      raise ArgumentError, "Missing rent amount for tenant #{@tenant.id}" if amount.blank?
      amount
    end

    def create_payment!(due_date)
      amount = determine_amount!
      ::Payment.create!(
        org_id: @tenant.org_id,
        tenant_id: @tenant.id,
        due_date: due_date,
        amount: amount,
        status: "due"
      )
    end
  end
end


