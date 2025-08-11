require 'rails_helper'

RSpec.describe "API::V1::Issues", type: :request do
  let!(:org) { create(:org) }
  let(:headers) { auth_headers_for(org_id: org.id) }

  describe "CRUD and filtering" do
    it "creates, lists with filters and sorts, updates, and scopes by org" do
      # Create issues in two orgs to test scoping
      other_org = create(:org)

      post "/api/v1/issues", params: { title: "Leaky faucet", severity: "medium", status: "open" }, headers: headers
      expect(response).to have_http_status(:created)
      created = JSON.parse(response.body)
      expect(created["title"]).to eq("Leaky faucet")

      post "/api/v1/issues", params: { title: "Broken window", severity: "high", status: "in_progress" }, headers: headers
      post "/api/v1/issues", params: { title: "Mold in bathroom", severity: "critical", status: "open" }, headers: headers

      # Issue in other org should not appear
      post "/api/v1/issues", params: { title: "Noise complaint", severity: "low", status: "open" }, headers: auth_headers_for(org_id: other_org.id)

      # List filtered by status
      get "/api/v1/issues", params: { status: "open", sort: "severity", order: "desc", page: 1, limit: 10 }, headers: headers
      expect(response).to have_http_status(:ok)
      list = JSON.parse(response.body)
      expect(list["items"].all? { |i| i["status"] == "open" }).to be(true)
      expect(list["total"]).to be >= 1

      # Update status
      issue_id = created["id"]
      patch "/api/v1/issues/#{issue_id}", params: { status: "resolved" }, headers: headers
      expect(response).to have_http_status(:ok)
      updated = JSON.parse(response.body)
      expect(updated["status"]).to eq("resolved")

      # Ensure scoping: fetching list with other org's headers should not include our issues
      get "/api/v1/issues", headers: auth_headers_for(org_id: other_org.id)
      list2 = JSON.parse(response.body)
      titles = list2["items"].map { |i| i["title"] }
      expect(titles).not_to include("Leaky faucet")
    end
  end
end


