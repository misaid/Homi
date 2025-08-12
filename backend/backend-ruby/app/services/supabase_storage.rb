require "http"

class SupabaseStorage
  class << self
    # Uploads an IO stream to Supabase Storage
    # Returns { bucket:, path: }
    def upload(bucket:, path:, io:, content_type: "application/octet-stream")
      base_url = ENV.fetch("SUPABASE_URL")
      api_key = ENV.fetch("SUPABASE_SERVICE_ROLE_KEY")
      url = File.join(base_url, "/storage/v1/object/", bucket.to_s, path)
      response = HTTP.auth("Bearer #{api_key}")
                     .headers("Content-Type" => content_type)
                     .put(url, body: io.read)
      raise "Supabase upload failed: #{response.status}" unless response.status.success?
      { bucket: bucket, path: path }
    end

    # Creates a signed URL for a private object
    def signed_url(bucket:, path:, expires_in: 3600)
      base_url = ENV.fetch("SUPABASE_URL")
      api_key = ENV.fetch("SUPABASE_SERVICE_ROLE_KEY")
      sign_url = File.join(base_url, "/storage/v1/object/sign/", bucket.to_s, path)
      response = HTTP.auth("Bearer #{api_key}")
                     .post(sign_url, json: { expiresIn: expires_in })
      raise "Supabase sign failed: #{response.status}" unless response.status.success?
      json = JSON.parse(response.body.to_s) rescue {}
      signed = json["signedURL"] || json["signedUrl"]
      raise "Supabase sign response missing signed URL" unless signed
      if signed.start_with?("http")
        signed
      else
        File.join(base_url, "/storage/v1", signed)
      end
    end

    # Builds a public URL for an object in a public bucket
    def public_url(bucket:, path:)
      base_url = ENV.fetch("SUPABASE_URL")
      File.join(base_url, "/storage/v1/object/public/", bucket.to_s, path)
    end
  end
end


