require 'rails_helper'

RSpec.describe 'Units', type: :request do
  let(:org) { create(:org) }
  let(:headers) do
    { 'X-API-Key' => ENV.fetch('API_KEY', 'dev_api_key'), 'X-Org-Id' => org.id }
  end

  it 'creates, lists, shows, updates, and deletes a unit' do
    # Create
    post '/v1/units', params: { unit: { name: 'A1', address: '123', monthly_rent: 1000 } }, headers: headers
    expect(response).to have_http_status(:created)
    unit_id = JSON.parse(response.body)['id']

    # Index
    get '/v1/units', headers: headers
    expect(response).to have_http_status(:ok)

    # Show
    get "/v1/units/#{unit_id}", headers: headers
    expect(response).to have_http_status(:ok)

    # Update
    patch "/v1/units/#{unit_id}", params: { unit: { name: 'A2' } }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['name']).to eq('A2')

    # Delete
    delete "/v1/units/#{unit_id}", headers: headers
    expect(response).to have_http_status(:no_content)
  end
end


