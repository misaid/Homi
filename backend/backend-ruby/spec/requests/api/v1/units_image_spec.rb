require "rails_helper"

RSpec.describe "Units image endpoints", type: :request do
  let(:org) { create(:org) }
  let(:unit) { create(:unit, org: org) }

  before do
    allow_any_instance_of(ClerkTokenVerifier).to receive(:decode!).and_return({ sub: "u1", sid: "s1", org_id: org.id })
  end

  def auth
    auth_headers_for(org_id: org.id)
  end

  it "uploads a valid image and sets image_url" do
    image_path = Rails.root.join("..", "..", "frontend", "assets", "images", "hero-illustration.webp").expand_path
    file = Rack::Test::UploadedFile.new(image_path, "image/webp", original_filename: "hero-illustration.webp")

    post "/api/v1/units/#{unit.id}/image", params: { file: file }, headers: auth
    expect([200, 201]).to include(response.status)
    body = JSON.parse(response.body)
    expect(body["image_url"]).to be_present
  end

  it "rejects wrong types" do
    file = Rack::Test::UploadedFile.new(StringIO.new("not image"), "text/plain", original_filename: "foo.txt")
    post "/api/v1/units/#{unit.id}/image", params: { file: file }, headers: auth
    expect(response.status).to eq(422)
  end

  it "deletes image and clears image_url" do
    unit.update!(image_url: "https://example.test/storage/v1/object/public/unit-media/units/#{unit.id}/x.webp")
    delete "/api/v1/units/#{unit.id}/image", headers: auth
    expect(response.status).to eq(204)
    expect(unit.reload.image_url).to be_nil
  end
end


