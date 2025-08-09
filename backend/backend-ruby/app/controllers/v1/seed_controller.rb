module V1
  class SeedController < ApplicationController
    def create
      unless ActiveModel::Type::Boolean.new.cast(ENV["ENABLE_SEED"]) || Rails.env.development?
        return render json: { error: "Seed disabled" }, status: :forbidden
      end

      org = Org.create!(name: "Demo Org")
      user = User.create!(org: org, email: "demo@example.com", role: "admin")
      unit = Unit.create!(org: org, name: "Unit A", address: "123 St", monthly_rent: 1200)
      tenant = Tenant.create!(org: org, full_name: "John Doe", email: "john@example.com", unit: unit, lease_start: Date.today, lease_end: 1.year.from_now)
      Payment.create!(org: org, tenant: tenant, due_date: Date.today + 7.days, amount: 1200, status: "due")

      render json: { ok: true, org_id: org.id, user_id: user.id, unit_id: unit.id, tenant_id: tenant.id }
    end
  end
end


