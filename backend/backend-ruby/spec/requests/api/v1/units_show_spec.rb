require 'rails_helper'

RSpec.describe "Api::V1::Units show", type: :request do
  let(:org) { create(:org) }

  before do
    allow_any_instance_of(ApplicationController).to receive(:current_org_id).and_return(org.id)
    allow_any_instance_of(ApplicationController).to receive(:require_organization!).and_return(true)
  end

  it "returns unit with beds, baths, photos, and occupants_count" do
    unit = create(:unit, org: org, beds: 2, baths: 1.0)
    unit.update!(photos: []) if unit.respond_to?(:photos)
    create(:tenant, org: org, unit: unit)

    get "/api/v1/units/#{unit.id}"
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["id"]).to eq(unit.id)
    expect(body["beds"]).to eq(2)
    expect(body["baths"]).to eq(1.0)
    expect(body["photos"]).to be_a(Array)
    expect(body["occupants_count"]).to eq(1)
  end
end


