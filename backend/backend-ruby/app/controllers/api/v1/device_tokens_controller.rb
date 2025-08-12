module Api
  module V1
    class DeviceTokensController < Api::BaseController
      before_action :require_organization!

      # POST /api/v1/device_tokens
      def create
        token = params[:token].to_s.strip
        platform = params[:platform].to_s
        if token.blank? || platform.blank?
          return render json: { error: "token_and_platform_required" }, status: :unprocessable_entity
        end

        record = DeviceToken.find_by(token: token)
        attrs = {
          org_id: current_org_id,
          user_id: current_user_id,
          platform: platform,
          last_seen_at: Time.current
        }
        if record
          record.update(attrs)
        else
          record = DeviceToken.create!(attrs.merge(token: token))
        end
        render json: { ok: true }
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end

      # DELETE /api/v1/device_tokens/:token
      def destroy
        token = params[:token].to_s
        if token.present?
          DeviceToken.where(token: token, user_id: current_user_id).delete_all
        end
        head :no_content
      end
    end
  end
end


