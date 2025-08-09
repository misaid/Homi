require 'rails_helper'

RSpec.describe 'Auth middleware behavior', type: :request do
  let(:org) { create(:org) }

  context 'missing token' do
    it 'returns 401' do
      get '/v1/me'
      expect(response).to have_http_status(:unauthorized)
      expect(json_body['error']).to be_present
    end
  end

  context 'invalid token' do
    it 'returns 401' do
      allow(AuthTokenVerifier).to receive(:verify).and_raise("invalid")
      get '/v1/me', headers: { 'Authorization' => 'Bearer bad' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'valid token but missing org' do
    it 'returns 403' do
      allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => nil })
      get '/v1/me', headers: { 'Authorization' => 'Bearer good' }
      expect(response).to have_http_status(:forbidden)
    end
  end

  context 'valid token and org' do
    it 'returns current user context' do
      allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
      get '/v1/me', headers: { 'Authorization' => 'Bearer good' }
      expect(response).to have_http_status(:ok)
      expect(json_body['org_id']).to eq(org.id)
      expect(json_body['user_id']).to eq('u1')
      expect(json_body['session_id']).to eq('s1')
    end
  end
end


