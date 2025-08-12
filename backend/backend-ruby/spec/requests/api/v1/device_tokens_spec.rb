require 'rails_helper'

RSpec.describe 'Device Tokens API', type: :request do
  let(:org) { create(:org) }
  let(:headers) { auth_header(org_id: org.id) }

  it 'registers or upserts a device token' do
    post '/api/v1/device_tokens', params: { token: 'ExponentPushToken[abc]', platform: 'ios' }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(DeviceToken.where(org_id: org.id, user_id: 'dev-user', token: 'ExponentPushToken[abc]').exists?).to eq(true)

    # Upsert updates platform and last_seen
    post '/api/v1/device_tokens', params: { token: 'ExponentPushToken[abc]', platform: 'android' }, headers: headers
    expect(response).to have_http_status(:ok)
    rec = DeviceToken.find_by(token: 'ExponentPushToken[abc]')
    expect(rec.platform).to eq('android')
  end

  it 'unregisters a device token' do
    DeviceToken.create!(org_id: org.id, user_id: 'dev-user', token: 'ExponentPushToken[x]', platform: 'ios')
    delete '/api/v1/device_tokens/ExponentPushToken[x]', headers: headers
    expect(response).to have_http_status(:no_content)
    expect(DeviceToken.find_by(token: 'ExponentPushToken[x]')).to be_nil
  end
end


