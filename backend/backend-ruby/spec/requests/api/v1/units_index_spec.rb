require 'rails_helper'

RSpec.describe "Api::V1::Units index", type: :request do
  let(:org) { create(:org) }

  before do
    allow_any_instance_of(ApplicationController).to receive(:current_org_id).and_return(org.id)
    allow_any_instance_of(ApplicationController).to receive(:require_organization!).and_return(true)
  end

  it "returns items with beds, baths, photos, and occupants_count" do
    unit = create(:unit, org: org, beds: 3, baths: 2.5, notes: "n", address: "a", monthly_rent: 1000, )
    unit.update!(photos: ["https://example.com/1.jpg"]) if unit.respond_to?(:photos)
    create(:tenant, org: org, unit: unit)
    create(:tenant, org: org, unit: unit)

    get "/api/v1/units?page=1&limit=20"
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body).to include("items", "page", "limit", "total", "hasMore")
    item = body["items"].find { |i| i["id"] == unit.id }
    expect(item["beds"]).to eq(3)
    expect(item["baths"]).to eq(2.5)
    expect(item["photos"]).to be_a(Array)
    expect(item["photos"].length).to eq(1)
    expect(item["occupants_count"]).to eq(2)
  end
end


