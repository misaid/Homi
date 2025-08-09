require 'rails_helper'

RSpec.describe 'Tenants', type: :request do
  let(:org) { create(:org) }
  let(:other_org) { create(:org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'lists tenants paginated' do
    create_list(:tenant, 2, org: org)
    get '/v1/tenants', headers: auth
    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['items']).to be_a(Array)
    expect(body.keys).to include('page', 'limit', 'total', 'hasMore')
  end

  it 'CRUD with org scoping' do
    unit = create(:unit, org: org)
    post '/v1/tenants', params: { tenant: { full_name: 'Jane', email: 'jane@example.com', unit_id: unit.id } }, headers: auth
    expect(response).to have_http_status(:created)
    id = json_body['id']

    get "/v1/tenants/#{id}", headers: auth
    expect(response).to have_http_status(:ok)

    put "/v1/tenants/#{id}", params: { tenant: { full_name: 'Janet' } }, headers: auth
    expect(response).to have_http_status(:ok)
    expect(json_body['full_name']).to eq('Janet')

    delete "/v1/tenants/#{id}", headers: auth
    expect(response).to have_http_status(:no_content)
  end

  it 'prevents cross-org access' do
    other = create(:tenant, org: other_org)
    get "/v1/tenants/#{other.id}", headers: auth
    expect(response).to have_http_status(:not_found)
  end
end


