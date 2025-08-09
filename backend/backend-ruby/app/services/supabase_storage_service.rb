require "http"

class SupabaseStorageService
  def initialize
    @base_url = ENV.fetch("SUPABASE_URL")
    @api_key = ENV.fetch("SUPABASE_SERVICE_ROLE_KEY")
  end

  def upload_file(bucket:, object_path:, io:, content_type: "application/octet-stream")
    url = File.join(@base_url, "/storage/v1/object/", bucket.to_s, object_path)
    response = HTTP.auth("Bearer #{@api_key}")
                   .headers("Content-Type" => content_type)
                   .put(url, body: io.read)
    response.status.success?
  end

  def download_file(bucket:, object_path:)
    url = File.join(@base_url, "/storage/v1/object/", bucket.to_s, object_path)
    response = HTTP.auth("Bearer #{@api_key}").get(url)
    return nil unless response.status.success?
    response.body.to_s
  end
end


