require 'rails_helper'

RSpec.describe 'Me', type: :request do
  let(:org) { create(:org) }
  let(:headers) do
    { 'X-API-Key' => ENV.fetch('API_KEY', 'dev_api_key'), 'X-Org-Id' => org.id }
  end

  it 'returns the current user context when API key is used' do
    get '/v1/me', headers: headers
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['org_id']).to eq(org.id)
  end
end


