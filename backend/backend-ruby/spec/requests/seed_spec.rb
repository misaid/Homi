require 'rails_helper'

RSpec.describe 'Seed', type: :request do
  let(:org) { create(:org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'returns forbidden when disabled' do
    old = ENV['ENABLE_SEED']
    begin
      ENV['ENABLE_SEED'] = 'false'
      post '/v1/seed', headers: auth
      expect(response).to have_http_status(:forbidden)
    ensure
      ENV['ENABLE_SEED'] = old
    end
  end

  it 'returns ok and counts when enabled' do
    old = ENV['ENABLE_SEED']
    begin
      ENV['ENABLE_SEED'] = 'true'
      post '/v1/seed', headers: auth
      expect(response).to have_http_status(:ok)
      expect(json_body['ok']).to eq(true)
      expect(json_body['org_id']).to be_present
    ensure
      ENV['ENABLE_SEED'] = old
    end
  end
end


