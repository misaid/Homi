module CurrentContext
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_and_set_context

    rescue_from ClerkTokenVerifier::Unauthorized do |e|
      render json: { error: e.message }, status: :unauthorized
    end
    rescue_from StandardError do |e|
      Rails.logger.warn({ event: "auth_error", message: e.message }.to_json)
      render json: { error: "Authentication failed" }, status: :unauthorized
    end
  end

  private

  def authenticate_and_set_context
    # API key bypass for trusted clients
    api_key = request.headers["X-API-KEY"]
    if api_key.present? && ENV["API_KEY"].present? && api_key == ENV["API_KEY"]
      header_org = request.headers["X-Organization-Id"]
      user_id = "api_key"
      org_id = OrgResolver.resolve_and_ensure!(
        clerk_org_id: header_org,
        fallback_name: "Service Org",
        user_id: user_id
      )
      @current_user_id = user_id
      @current_org_id = org_id
      return
    end

    token = bearer_token || request.headers["X-CLERK-AUTH"] || request.headers["CLERK-AUTH"]
    verifier = ClerkTokenVerifier.new
    payload = verifier.decode!(token)

    user_id = payload[:sub]
    raise ClerkTokenVerifier::Unauthorized, "missing sub" if user_id.blank?

    claims_org = payload[:org_id] || payload[:orgId]
    header_org = request.headers["X-Organization-Id"]
    clerk_org_id = header_org.presence || claims_org

    fallback_name = payload[:email] || "Personal Org"
    org_id = OrgResolver.resolve_and_ensure!(
      clerk_org_id: clerk_org_id,
      fallback_name: fallback_name,
      user_id: user_id
    )

    Rails.logger.info({ event: "auth_ok", user_id: user_id, has_sid: payload[:sid].present?, in_header_org: header_org.present?, clerk_org_claim: claims_org }.to_json)
    Rails.logger.info({ event: "org_resolved", source: header_org.present? ? "header" : (claims_org.present? ? "claims" : "personal"), org_id: org_id }.to_json)

    @current_user_id = user_id
    @current_org_id = org_id
  end

  def bearer_token
    auth = request.headers["Authorization"]
    return nil if auth.blank?
    scheme, value = auth.split(" ", 2)
    return value if scheme&.downcase == "bearer"
    nil
  end

  def current_user_id
    @current_user_id
  end

  def current_org_id
    @current_org_id
  end
end


