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


