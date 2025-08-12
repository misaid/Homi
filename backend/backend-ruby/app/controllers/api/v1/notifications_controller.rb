module Api
  module V1
    class NotificationsController < Api::BaseController
      before_action :require_organization!
      before_action :set_notification, only: [:read]

      # GET /api/v1/notifications
      # Params: page, limit, only_unread
      def index
        scope = Notification.where(org_id: current_org_id, user_id: current_user_id)
        scope = scope.where(read_at: nil) if ActiveModel::Type::Boolean.new.cast(params[:only_unread])
        scope = scope.order(created_at: :desc)

        pagy_obj, records = pagy(scope, page: params[:page], items: params[:limit])
        meta = pagy_metadata(pagy_obj)
        items = records.map do |n|
          n.as_json(only: [:id, :title, :body, :kind, :data, :read_at, :created_at])
        end
        render json: { items: items, page: meta[:page], limit: meta[:items], total: meta[:count], hasMore: meta[:page] < meta[:pages] }
      end

      # PATCH /api/v1/notifications/:id/read
      def read
        @notification.update(read_at: Time.current)
        render json: { ok: true }
      end

      # PATCH /api/v1/notifications/read_all
      def read_all
        Notification.where(org_id: current_org_id, user_id: current_user_id, read_at: nil).update_all(read_at: Time.current)
        render json: { ok: true }
      end

      # POST /api/v1/notifications
      # Admin/system only in future; for now allow any authed user in org
      def create
        permitted = params.permit(:user_id, :title, :body, :kind, data: {})
        target_user_id = permitted[:user_id].presence || current_user_id
        notification = Notification.create!(
          org_id: current_org_id,
          user_id: target_user_id,
          title: permitted[:title],
          body: permitted[:body],
          kind: permitted[:kind].presence || 'general',
          data: permitted[:data].presence || {}
        )
        PushNotifications::SendJob.perform_later(org_id: current_org_id, user_id: target_user_id, title: notification.title, body: notification.body, data: notification.data || {})
        render json: notification.as_json(only: [:id, :title, :body, :kind, :data, :read_at, :created_at]), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end

      private

      def set_notification
        @notification = Notification.where(org_id: current_org_id, user_id: current_user_id).find(params[:id])
      end
    end
  end
end


