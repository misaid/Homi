module V1
  class MetricsController < ApplicationController
    before_action :require_organization!

    # GET /api/v1/metrics/rent_summary?from=YYYY-MM&to=YYYY-MM
    def rent_summary
      from_month, to_month = parse_month_range(params[:from], params[:to])

      due_by_month = Payment
        .where(org_id: current_org_id)
        .where(due_date: from_month..to_month)
        .group("to_char(due_date, 'YYYY-MM')")
        .sum(:amount)

      paid_by_month = Payment
        .where(org_id: current_org_id, status: 'paid')
        .where(paid_at: from_month.beginning_of_month..to_month.end_of_month)
        .group("to_char(paid_at, 'YYYY-MM')")
        .sum(:amount)

      months = months_between(from_month, to_month)
      items = months.map do |ym|
        paid = BigDecimal(paid_by_month[ym].to_s.presence || '0')
        due = BigDecimal(due_by_month[ym].to_s.presence || '0')
        rate = due.zero? ? 0.0 : (paid / due).to_f
        {
          month: ym,
          paid_amount: paid.to_s('F'),
          due_amount: due.to_s('F'),
          collection_rate: rate
        }
      end

      render json: {
        items: items,
        from: from_month.strftime('%Y-%m'),
        to: to_month.strftime('%Y-%m')
      }
    end

    private

    def parse_month_range(from_param, to_param)
      if from_param.present? && to_param.present?
        from = Date.strptime(from_param, '%Y-%m') rescue nil
        to = Date.strptime(to_param, '%Y-%m') rescue nil
        if from && to && from <= to
          return [from.beginning_of_month, to.beginning_of_month]
        end
      end

      # Default: last 6 months including current month
      to = Date.today.beginning_of_month
      from = (to << 5) # include current and previous 5 months
      [from, to]
    end

    def months_between(from_month, to_month)
      months = []
      cursor = from_month.beginning_of_month
      while cursor <= to_month.beginning_of_month
        months << cursor.strftime('%Y-%m')
        cursor = cursor.next_month
      end
      months
    end
  end
end


