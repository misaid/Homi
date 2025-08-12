module Api
  module V1
    class UnitsImagesController < ApplicationController
      before_action :require_organization!
      before_action :set_unit

      MAX_BYTES = 5 * 1024 * 1024
      ALLOWED = ["image/jpeg", "image/png", "image/webp"].freeze

      def create
        file = params[:file]
        log_event(
          "units_image_upload_start",
          filename: (file.respond_to?(:original_filename) ? file.original_filename : nil),
          content_type: (file.respond_to?(:content_type) ? file.content_type : nil),
          size: (file.respond_to?(:size) ? file.size : nil)
        )
        unless file.present?
          log_event("units_image_upload_reject", reason: "file_required")
          return render json: { error: "file_required" }, status: :unprocessable_entity
        end
        unless file.respond_to?(:content_type) && ALLOWED.include?(file.content_type)
          log_event("units_image_upload_reject", reason: "invalid_type", content_type: file.content_type)
          return render json: { error: "invalid_type" }, status: :unprocessable_entity
        end
        if !file.respond_to?(:size) || file.size.to_i <= 0
          log_event("units_image_upload_reject", reason: "invalid_file_param")
          return render json: { error: "invalid_file_param" }, status: :unprocessable_entity
        end
        if file.size.to_i > MAX_BYTES
          log_event("units_image_upload_reject", reason: "file_too_large", size: file.size)
          return render json: { error: "file_too_large" }, status: :unprocessable_entity
        end

        client = ::Supabase::StorageClient.new
        key = client.build_key(unit_id: @unit.id, original_filename: (file.respond_to?(:original_filename) ? file.original_filename : nil))

        # Best-effort delete previous
        if @unit.image_url.present?
          begin
            prev_path = extract_path_from_public_url(@unit.image_url)
            log_event("units_image_delete_previous_attempt", previous_url: @unit.image_url, previous_path: prev_path)
            ok = prev_path && client.delete_object(bucket: ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media"), key: prev_path)
            log_event("units_image_delete_previous_done", success: !!ok)
          rescue StandardError => e
            log_event("units_image_delete_previous_error", error: e.message)
          end
        end

        upload = client.upload_object(
          bucket: ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media"),
          key: key,
          io: file.tempfile,
          content_type: file.content_type
        )

        log_event("units_image_uploaded", bucket: ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media"), key: upload[:key], public_url: upload[:public_url])
        @unit.update!(image_key: upload[:key], image_url: nil)
        display_url = ::Supabase::UrlResolver.new.display_url_for_unit(@unit)
        log_event("units_image_key_saved", image_key: upload[:key], display_url: display_url)
        render json: { image_key: upload[:key], display_url: display_url }, status: :ok
      end

      def destroy
        log_event("units_image_delete_start", current_url: @unit.image_url)
        if @unit.image_url.present?
          begin
            client = ::Supabase::StorageClient.new
            prev_key = @unit.image_key.presence || extract_path_from_public_url(@unit.image_url)
            log_event("units_image_delete_attempt", previous_path: prev_key)
            ok = prev_key && client.delete_object(bucket: ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media"), key: prev_key)
            log_event("units_image_delete_done", success: !!ok)
          rescue StandardError => e
            log_event("units_image_delete_error", error: e.message)
          end
        end
        @unit.update!(image_key: nil, image_url: nil)
        log_event("units_image_cleared")
        head :no_content
      end

      private

      def set_unit
        @unit = Unit.where(org_id: current_org_id).find(params[:id])
      end

      def extract_path_from_public_url(url)
        # #{SUPABASE_URL}/storage/v1/object/public/<bucket>/<path>
        u = URI.parse(url)
        parts = u.path.split("/public/").last
        return nil unless parts
        bucket_and_path = parts.split("/", 2)
        bucket_and_path[1]
      rescue StandardError
        nil
      end

      def log_event(event, **extra)
        Rails.logger.info({
          event: event,
          request_id: request.request_id,
          unit_id: @unit&.id,
          org_id: current_org_id,
          user_id: current_user_id
        }.merge(extra).to_json)
      end
    end
  end
end


