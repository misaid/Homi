class ClerkAuthenticator
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Allow healthcheck, docs, and auth stubs without auth
    if request.path.start_with?("/up") || request.path.start_with?("/healthz") || request.path.start_with?("/docs") || request.path.start_with?("/api-docs") || request.path.start_with?("/v1/auth/")
      return @app.call(env)
    end

    auth_header = request.get_header("HTTP_AUTHORIZATION")
    token = auth_header&.split(" ")&.last

    # Skip if API key is used; handled in controller
    if request.get_header("HTTP_X_API_KEY").present?
      return @app.call(env)
    end

    return unauthorized unless token.present?

    # Delegate to verifier service so tests can stub easily
    begin
      if ENV["CLERK_BYPASS"].present?
        payload = { "sub" => "dev-user", "sid" => "dev-session", "org_id" => request.get_header("HTTP_X_ORG_ID") }
      else
        payload = AuthTokenVerifier.verify(token)
      end
      env["clerk.user_id"] = payload["sub"] || payload["user_id"]
      env["clerk.session_id"] = payload["sid"] || payload["session_id"]
      env["clerk.org_id"] = payload["org_id"]
    rescue StandardError
      return unauthorized
    end

    @app.call(env)
  end

  private

  def unauthorized
    [401, { "Content-Type" => "application/json" }, [{ error: "Unauthorized" }.to_json]]
  end
end


