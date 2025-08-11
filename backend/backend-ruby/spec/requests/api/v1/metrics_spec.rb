require 'rails_helper'

RSpec.describe "API::V1::Metrics", type: :request do
  let!(:org) { create(:org) }
  let(:headers) { auth_headers_for(org_id: org.id) }

  describe "GET /api/v1/metrics/rent_summary" do
    it "returns items within default 6-month window" do
      tenant = create(:tenant, org: org)
      # Due items over months
      3.times do |i|
        create(:payment, org: org, tenant: tenant, due_date: (Date.today.beginning_of_month - i.months), amount: 1000)
      end
      # Paid in current month
      paid = create(:payment, org: org, tenant: tenant, due_date: Date.today.beginning_of_month, amount: 600, status: 'paid', paid_at: Time.current)

      get "/api/v1/metrics/rent_summary", headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["items"]).to be_an(Array)
      expect(json["items"].last).to include("month" => Date.today.strftime('%Y-%m'))
      current = json["items"].find { |i| i["month"] == Date.today.strftime('%Y-%m') }
      expect(current["paid_amount"].to_f).to be >= 0
      expect(current).to have_key("due_amount")
      expect(current).to have_key("collection_rate")
    end

    it "respects from/to params" do
      tenant = create(:tenant, org: org)
      create(:payment, org: org, tenant: tenant, due_date: Date.new(2025,5,1), amount: 500)
      create(:payment, org: org, tenant: tenant, status: 'paid', paid_at: Time.utc(2025,5,3), due_date: Date.new(2025,5,1), amount: 200)

      get "/api/v1/metrics/rent_summary", params: { from: '2025-05', to: '2025-05' }, headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["from"]).to eq('2025-05')
      expect(json["to"]).to eq('2025-05')
      expect(json["items"].size).to eq(1)
      row = json["items"].first
      expect(row["month"]).to eq('2025-05')
      expect(row["due_amount"]).to eq('500.0')
      expect(row["paid_amount"]).to eq('200.0')
      expect(row["collection_rate"]).to be_within(0.0001).of(0.4)
    end
  end
end


