module JsonHelper
  def json_body
    JSON.parse(response.body)
  rescue JSON::ParserError
    raise "Response is not valid JSON: #{response.body.inspect}"
  end
end

RSpec.configure do |config|
  config.include JsonHelper, type: :request
end


