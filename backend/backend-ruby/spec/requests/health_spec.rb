require 'rails_helper'

RSpec.describe 'Health', type: :request do
  it 'GET /healthz returns ok' do
    get '/healthz'
    expect(response).to have_http_status(:ok)
    expect(json_body['ok']).to eq(true)
  end
end


