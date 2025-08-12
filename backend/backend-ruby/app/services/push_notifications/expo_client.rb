require "faraday"

module PushNotifications
  class ExpoClient
    DEFAULT_URL = (ENV["EXPO_PUSH_URL"].presence || "https://exp.host/--/api/v2/push/send")

    def initialize(base_url: DEFAULT_URL)
      @base_url = base_url
      @conn = Faraday.new do |f|
        f.request :retry, max: 2, interval: 0.2, interval_randomness: 0.2, backoff_factor: 2
        f.adapter Faraday.default_adapter
      end
    end

    # messages: array of hashes { to:, title:, body:, data: }
    # returns parsed JSON body or raises
    def send_messages(messages)
      resp = @conn.post(@base_url) do |req|
        req.headers["Content-Type"] = "application/json"
        # Expo expects an array of message objects as the body
        req.body = messages.to_json
      end
      raise "expo_push_failed: #{resp.status}" unless resp.success?
      JSON.parse(resp.body) rescue { "data" => [] }
    end
  end
end


