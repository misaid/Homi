require "net/http"
require "uri"
require "json"
require "jwt"

class JwtJwksVerifier
  class << self
    def verify(token, issuer:)
      payload, _header = JWT.decode(token, nil, true, algorithms: ["RS256"], jwks: jwks_loader(issuer), verify_iss: true, iss: issuer)
      payload
    end

    private

    def jwks_loader(issuer)
      jwks_uri = URI.join(issuer, "/.well-known/jwks.json").to_s
      lambda do |options|
        @jwks_cache ||= {}
        cached = @jwks_cache[jwks_uri]
        if cached && Time.now < cached[:expires_at]
          cached[:jwks]
        else
          jwks = fetch_jwks(jwks_uri)
          @jwks_cache[jwks_uri] = { jwks: jwks, expires_at: Time.now + 300 }
          jwks
        end
      end
    end

    def fetch_jwks(url)
      uri = URI.parse(url)
      response = Net::HTTP.get_response(uri)
      raise "JWKS fetch failed" unless response.is_a?(Net::HTTPSuccess)
      data = JSON.parse(response.body)
      data
    end
  end
end


