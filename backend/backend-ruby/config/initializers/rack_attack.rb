class Rack::Attack
  # Throttle requests to 100 reqs / 1 minute per IP
  throttle("req/ip", limit: 100, period: 1.minute) do |req|
    req.ip
  end

  # Allow healthcheck, docs
  safelist("health_and_docs") do |req|
    req.path.start_with?("/up") || req.path.start_with?("/docs") || req.path.start_with?("/openapi")
  end
end


