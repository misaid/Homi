module CurrentContext
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_and_set_context

    rescue_from ClerkTokenVerifier::Unauthorized do |e|
      render json: { error: e.message }, status: :unauthorized
    end
  end

  private

  def authenticate_and_set_context
    token = bearer_token || request.headers["X-CLERK-AUTH"] || request.headers["CLERK-AUTH"]
    verifier = ClerkTokenVerifier.new
    payload = verifier.verify!(token)

    user_id = payload[:sub]
    claims_org = payload[:org_id] || payload[:orgId]
    header_org = request.headers["X-Organization-Id"]
    clerk_org_id = header_org.presence || claims_org

    fallback_name = payload[:email] || "Personal Org"
    org_id = OrgResolver.resolve_and_ensure!(clerk_org_id: clerk_org_id, fallback_name: fallback_name)

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


