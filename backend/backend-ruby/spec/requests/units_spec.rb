require 'rails_helper'

RSpec.describe 'Units', type: :request do
  let(:org) { create(:org) }
  let(:other_org) { create(:org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'lists units paginated with shape { items, page, limit, total, hasMore } and includes occupants_count' do
    u = create(:unit, org: org)
    create(:tenant, org: org, unit: u)
    get '/v1/units', headers: auth
    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['items']).to be_a(Array)
    expect(body.keys).to include('page', 'limit', 'total', 'hasMore')
    item = body['items'].find { |i| i['id'] == u.id }
    expect(item['occupants_count']).to be >= 1
  end

  it 'creates a unit with org scoping' do
    post '/v1/units', params: { unit: { name: 'A1', address: '123', monthly_rent: 1000 } }, headers: auth
    expect(response).to have_http_status(:created)
    id = json_body['id']
    u = Unit.find(id)
    expect(u.org_id).to eq(org.id)
  end

  it 'shows, updates, and deletes a unit' do
    unit = create(:unit, org: org, name: 'A1')
    get "/v1/units/#{unit.id}", headers: auth
    expect(response).to have_http_status(:ok)

    put "/v1/units/#{unit.id}", params: { unit: { name: 'A2' } }, headers: auth
    expect(response).to have_http_status(:ok)
    expect(json_body['name']).to eq('A2')

    delete "/v1/units/#{unit.id}", headers: auth
    expect(response).to have_http_status(:no_content)
  end

  it 'prevents cross-org access' do
    unit_other = create(:unit, org: other_org)
    get "/v1/units/#{unit_other.id}", headers: auth
    expect(response).to have_http_status(:not_found)
  end
end


