require "net/http"
require "uri"
require "json"
require "jwt"

class ClerkTokenVerifier
  class Unauthorized < StandardError; end

  CACHE_KEY_PREFIX = "clerk_jwks:".freeze
  CACHE_TTL = 10.minutes

  def initialize(issuer: ENV["CLERK_ISSUER"], audience: ENV["CLERK_AUDIENCE"])
    @issuer = issuer
    @audience = audience.presence
    raise ArgumentError, "issuer required" if @issuer.blank?
  end

  def verify!(token)
    raise Unauthorized, "token missing" if token.blank?

    payload, _header = JWT.decode(
      token,
      nil,
      true,
      algorithms: ["RS256"],
      jwks: jwks_loader,
      verify_iss: true,
      iss: @issuer,
      verify_aud: @audience.present?,
      aud: @audience
    )

    deep_symbolize(payload)
  rescue JWT::DecodeError, StandardError => e
    raise Unauthorized, "invalid token: #{e.message}"
  end

  private

  def jwks_loader
    jwks_url = URI.join(@issuer, "/.well-known/jwks.json").to_s
    cached = Rails.cache.read(cache_key(jwks_url))
    return cached if cached.present?

    jwks = fetch_jwks(jwks_url)
    Rails.cache.write(cache_key(jwks_url), jwks, expires_in: CACHE_TTL)
    jwks
  end

  def fetch_jwks(url)
    uri = URI.parse(url)
    response = Net::HTTP.get_response(uri)
    raise Unauthorized, "jwks fetch failed" unless response.is_a?(Net::HTTPSuccess)
    JSON.parse(response.body)
  end

  def cache_key(url)
    "#{CACHE_KEY_PREFIX}#{url}"
  end

  def deep_symbolize(obj)
    case obj
    when Hash
      obj.to_h { |k, v| [k.to_sym, deep_symbolize(v)] }
    when Array
      obj.map { |v| deep_symbolize(v) }
    else
      obj
    end
  end
end


