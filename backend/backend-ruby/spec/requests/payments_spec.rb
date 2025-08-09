require 'rails_helper'

RSpec.describe 'Payments', type: :request do
  let(:org) { create(:org) }
  let(:other_org) { create(:org) }
  let(:tenant) { create(:tenant, org: org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'filters and paginates index with shape { items, page, limit, total, hasMore }' do
    create(:payment, org: org, tenant: tenant, status: 'due', due_date: Date.today)
    create(:payment, org: org, tenant: tenant, status: 'paid', due_date: Date.today - 5)
    get '/v1/payments', params: { status: 'due', from: Date.today - 1 }, headers: auth
    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['items'].all? { |p| p['status'] == 'due' }).to be(true)
    expect(body.keys).to include('page', 'limit', 'total', 'hasMore')
  end

  it 'pay action marks as paid' do
    payment = create(:payment, org: org, tenant: tenant, status: 'due')
    post "/v1/payments/#{payment.id}/pay", params: { method: 'cash' }, headers: auth
    expect(response).to have_http_status(:ok)
    expect(json_body['status']).to eq('paid')
    expect(json_body['paid_at']).to be_present
  end

  it 'paying an already paid payment is idempotent (200)' do
    payment = create(:payment, org: org, tenant: tenant, status: 'paid', paid_at: Time.current)
    post "/v1/payments/#{payment.id}/pay", headers: auth
    expect(response).to have_http_status(:ok)
    expect(json_body['status']).to eq('paid')
  end

  it 'prevents cross-org access' do
    other_tenant = create(:tenant, org: other_org)
    other_payment = create(:payment, org: other_org, tenant: other_tenant)
    get "/v1/payments/#{other_payment.id}", headers: auth
    expect(response).to have_http_status(:not_found)
  end
end


