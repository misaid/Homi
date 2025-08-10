# Be sure to restart your server when you modify this file.

# CORS configuration.
# - In development, allow any origin, any headers, any methods (fully open for DX).
# - In other environments, leave existing policy as-is (no changes/widening here).

if Rails.env.development?
  # Allow everything in development to avoid CORS friction during local development
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins "*"
      resource "*",
               headers: :any,
               methods: %i[get post put patch delete options head]
    end
  end
end

# NOTE: If you maintain a restricted CORS policy for non-development environments,
# keep it configured wherever you currently manage it. We intentionally do not
# change production/test here to avoid loosening existing restrictions.
