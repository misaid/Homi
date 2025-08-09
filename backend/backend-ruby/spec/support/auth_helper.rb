module AuthHelper
  def auth_header(org_id: nil, user_id: "user_123", session_id: "sess_123")
    token = "test-token"
    headers = { 'Authorization' => "Bearer #{token}" }
    headers['X-Org-Id'] = org_id if org_id
    headers
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end


