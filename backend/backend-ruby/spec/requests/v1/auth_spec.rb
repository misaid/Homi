require 'rails_helper'

RSpec.describe 'Auth via Clerk middleware', type: :request do
  let(:org) { create(:org) }

  context 'valid token' do
    it 'allows access when token valid and org present' do
      headers = auth_headers_for(org_id: org.id)
      get '/v1/me', headers: headers.merge('X-API-Key' => nil).compact
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['org_id']).to eq(org.id)
    end
  end

  context 'missing token' do
    it 'returns 401' do
      get '/v1/me'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'invalid token' do
    it 'returns 401' do
      headers = { 'Authorization' => 'Bearer invalid' }
      get '/v1/me', headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end


