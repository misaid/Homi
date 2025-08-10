module Api
  class DebugController < Api::BaseController
    def auth
      unless Rails.env.development?
        return render json: { error: "Not Found" }, status: :not_found
      end

      token = request.headers["Authorization"]&.split(" ", 2)&.last || request.headers["X-CLERK-AUTH"] || request.headers["CLERK-AUTH"]
      payload = {}
      begin
        payload = ClerkTokenVerifier.new.decode!(token)
      rescue StandardError => _
        payload = {}
      end

      header_org = request.headers["X-Organization-Id"].presence
      claims_org = payload[:org_id] || payload[:orgId]
      resolved_org = @current_org_id

      render json: {
        userId: @current_user_id,
        hasSid: payload[:sid].present?,
        clerkOrgClaim: claims_org,
        headerOrgId: header_org,
        resolvedOrgId: resolved_org,
        claims: payload.except(:signature, :iss, :aud)
      }
    end
  end
end


