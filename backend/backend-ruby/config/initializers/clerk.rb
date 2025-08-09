# Clerk configuration placeholder. We only verify tokens in middleware and
# allow API key bypass for internal use/tests. Configure here if needed when
# using Clerk fully. Guarded to avoid boot errors.
if defined?(Clerk) && Clerk.respond_to?(:configure) && ENV["CLERK_SECRET_KEY"].present?
  begin
    Clerk.configure do |config|
      # Some versions of the SDK may not expose a writer; skip if unsupported.
      config.secret_key = ENV["CLERK_SECRET_KEY"] if config.respond_to?(:secret_key=)
    end
  rescue StandardError
    # no-op
  end
end


