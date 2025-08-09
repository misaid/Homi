require 'rails_helper'

RSpec.describe 'Health & Auth', type: :request do
  it 'returns up' do
    get '/up'
    expect(response).to have_http_status(:ok)
  end

  it 'auth stubs' do
    post '/v1/auth/register'
    expect(response).to have_http_status(:ok)
    post '/v1/auth/login'
    expect(response).to have_http_status(:ok)
  end
end


