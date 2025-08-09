module AuthHelpers
  def auth_headers_for(user_id: "user_123", session_id: "sess_123", org_id: nil)
    token = jwt_for(user_id: user_id, session_id: session_id, org_id: org_id)
    headers = { 'Authorization' => "Bearer #{token}" }
    headers['X-Org-Id'] = org_id if org_id
    headers
  end

  def jwt_for(user_id:, session_id:, org_id: nil)
    # In test, rely on CLERK_BYPASS which our middleware recognizes.
    # We still return a syntactically valid JWT.
    header = Base64.urlsafe_encode64({ alg: 'none', typ: 'JWT' }.to_json, padding: false)
    payload = Base64.urlsafe_encode64({ sub: user_id, sid: session_id, org_id: org_id }.compact.to_json, padding: false)
    signature = ''
    [header, payload, signature].join('.')
  end
end

RSpec.configure do |config|
  config.include AuthHelpers
end


