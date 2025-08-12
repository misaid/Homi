module PushNotifications
  class SendJob < ApplicationJob
    queue_as :default

    # Arguments: org_id (UUID), user_id (UUID), title (String), body (String), data (Hash)
    def perform(org_id:, user_id:, title:, body:, data: {})
      tokens = DeviceToken.where(org_id: org_id, user_id: user_id).pluck(:token)
      return if tokens.empty?

      client = PushNotifications::ExpoClient.new
      tokens.each_slice(100) do |batch|
        messages = batch.map { |t|
          { to: t, title: title, body: body, data: data }
        }
        begin
          response = client.send_messages(messages)
          handle_receipts(batch, response)
        rescue StandardError => e
          Rails.logger.warn({ event: "expo_push_error", error: e.message }.to_json)
        end
      end
    end

    private

    def handle_receipts(tokens, response)
      data = (response["data"] || [])
      tokens.zip(data).each do |token, receipt|
        next unless receipt.is_a?(Hash)
        status = receipt["status"] || receipt[:status]
        details = receipt["details"] || {}
        if status == "error"
          err = receipt["message"] || "unknown"
          code = details["error"]
          Rails.logger.warn({ event: "expo_push_receipt_error", token: token, code: code, message: err }.to_json)
          if code.to_s == "DeviceNotRegistered"
            DeviceToken.where(token: token).delete_all
          end
        end
      end
    end
  end
end


