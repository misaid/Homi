require 'rails_helper'

RSpec.describe 'API V1 Tenants index', type: :request do
  let(:org) { create(:org) }
  let(:other_org) { create(:org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'filters by q across name/email/phone' do
    create(:tenant, org: org, full_name: 'Peter Parker', email: 'spidey@dailybugle.com', phone: '+15551234')
    create(:tenant, org: org, full_name: 'Mary Jane', email: 'mary@gmail.com', phone: '+15556789')
    create(:tenant, org: other_org, full_name: 'Peter Other', email: 'other@x.com', phone: '+1999')

    get '/api/v1/tenants', params: { q: 'per', page: 1, limit: 20 }, headers: auth
    expect(response).to have_http_status(:ok)
    names = json_body['items'].map { |t| t['full_name'] }
    expect(names).to include('Peter Parker')
    expect(names).not_to include('Peter Other')

    get '/api/v1/tenants', params: { q: 'gmail', page: 1, limit: 20 }, headers: auth
    emails = json_body['items'].map { |t| t['email'] }
    expect(emails.any? { |e| e&.include?('gmail') }).to eq(true)

    get '/api/v1/tenants', params: { q: '+1555', page: 1, limit: 20 }, headers: auth
    phones = json_body['items'].map { |t| t['phone'] }
    expect(phones.any? { |p| p&.start_with?('+1555') }).to eq(true)
  end

  it 'sorts by name asc' do
    create(:tenant, org: org, full_name: 'Beta')
    create(:tenant, org: org, full_name: 'Alpha')
    get '/api/v1/tenants', params: { sort: 'name', order: 'asc', page: 1, limit: 20 }, headers: auth
    expect(response).to have_http_status(:ok)
    names = json_body['items'].map { |t| t['full_name'] }
    expect(names).to eq(names.sort)
  end

  it 'sorts by lease_start asc' do
    create(:tenant, org: org, full_name: 'A', lease_start: Date.new(2023,1,1))
    create(:tenant, org: org, full_name: 'B', lease_start: Date.new(2022,1,1))
    get '/api/v1/tenants', params: { sort: 'lease_start', order: 'asc', page: 1, limit: 20 }, headers: auth
    dates = json_body['items'].map { |t| t['lease_start'] }
    expect(dates.compact).to eq(dates.compact.sort)
  end

  it 'defaults to name asc' do
    create(:tenant, org: org, full_name: 'Charlie')
    create(:tenant, org: org, full_name: 'Alice')
    create(:tenant, org: org, full_name: 'Bob')
    get '/api/v1/tenants', params: { page: 1, limit: 20 }, headers: auth
    names = json_body['items'].map { |t| t['full_name'] }
    expect(names).to eq(names.sort)
  end

  it 'paginates with search' do
    25.times { |i| create(:tenant, org: org, full_name: "Person #{i}") }
    get '/api/v1/tenants', params: { q: 'Person', page: 1, limit: 10 }, headers: auth
    body1 = json_body
    expect(body1['items'].length).to eq(10)
    expect(body1['hasMore']).to eq(true)

    get '/api/v1/tenants', params: { q: 'Person', page: 3, limit: 10 }, headers: auth
    body3 = json_body
    expect(body3['items'].length).to be_between(5,10)
    expect(body3['page']).to eq(3)
  end
end


