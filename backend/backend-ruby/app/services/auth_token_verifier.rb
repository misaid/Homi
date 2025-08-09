class AuthTokenVerifier
  def self.verify(token)
    raise ArgumentError, "token required" if token.nil? || token.empty?

    # Test/dev bypass
    if ENV["CLERK_BYPASS"].present?
      return { "sub" => "dev-user", "sid" => "dev-session" }
    end

    issuer = ENV["CLERK_ISSUER"]
    raise "CLERK_ISSUER missing" if issuer.blank?

    JwtJwksVerifier.verify(token, issuer: issuer)
  end
end

class AuthTokenVerifier
  class << self
    # Returns a payload hash with keys: "sub" (user_id), "sid" (session_id), "org_id"
    # Raises on invalid token
    def verify(token)
      issuer = ENV["CLERK_ISSUER"]
      raise "Missing issuer" if issuer.blank?

      JwtJwksVerifier.verify(token, issuer: issuer)
    end
  end
end


