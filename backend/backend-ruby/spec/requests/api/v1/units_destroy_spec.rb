require 'rails_helper'

RSpec.describe "Api::V1::Units destroy", type: :request do
  let(:org) { create(:org) }
  let(:headers) { { 'ACCEPT' => 'application/json' } }

  before do
    allow_any_instance_of(ApplicationController).to receive(:current_org_id).and_return(org.id)
    allow_any_instance_of(ApplicationController).to receive(:require_organization!).and_return(true)
  end

  describe "DELETE /api/v1/units/:id" do
    context "when unit has no tenants" do
      it "deletes and returns 204" do
        unit = create(:unit, org: org)
        delete api_v1_unit_path(unit), headers: headers
        expect(response).to have_http_status(:no_content)
        expect(Unit.where(id: unit.id)).to be_empty
      end
    end

    context "when unit has tenants and no force" do
      it "returns 409 conflict with error payload" do
        unit = create(:unit, org: org)
        create(:tenant, org: org, unit: unit)
        delete api_v1_unit_path(unit), headers: headers
        expect(response).to have_http_status(:conflict)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("unit_has_tenants")
        expect(json["message"]).to include("Cannot delete a unit")
        expect(Unit.where(id: unit.id)).to exist
      end
    end

    context "when unit has tenants and force=true" do
      it "nullifies tenants and deletes the unit" do
        unit = create(:unit, org: org)
        tenant = create(:tenant, org: org, unit: unit)

        delete api_v1_unit_path(unit, force: true), headers: headers
        expect(response).to have_http_status(:no_content)
        expect(Unit.where(id: unit.id)).to be_empty
        expect(Tenant.find(tenant.id).unit_id).to be_nil
      end
    end
  end
end


