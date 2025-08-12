module Supabase
  class UrlResolver
    def initialize(client: StorageClient.new)
      @client = client
      @bucket = ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media")
      @is_public = ENV["SUPABASE_UNITS_BUCKET_PUBLIC"] == "true"
    end

    def display_url_for_unit(unit)
      if unit.image_key.present?
        return public_url(unit.image_key) if @is_public
        return @client.sign_url(bucket: @bucket, key: unit.image_key, expires_in_seconds: 604_800)[:signed_url]
      end
      unit.image_url.presence
    end

    private

    def public_url(key)
      @client.public_url(bucket: @bucket, key: key)
    end
  end
end


