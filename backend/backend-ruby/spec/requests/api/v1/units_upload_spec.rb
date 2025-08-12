require "rails_helper"

RSpec.describe "Units image upload", type: :request do
  let(:org) { create(:org) }

  before do
    # Bypass middleware by providing a simple token the verifier accepts
    allow_any_instance_of(ClerkTokenVerifier).to receive(:decode!).and_return({ sub: "u1", sid: "s1", org_id: org.id })
  end

  def auth
    auth_headers_for(org_id: org.id)
  end

  it "uploads hero-illustration.webp and sets cover_image_uri on create" do
    image_path = Rails.root.join("..", "..", "frontend", "assets", "images", "hero-illustration.webp").expand_path
    file = Rack::Test::UploadedFile.new(image_path, "image/webp", original_filename: "hero-illustration.webp")

    # No stubs: hit real Supabase

    post "/api/v1/units",
         params: {
           name: "Hero Unit",
           address: "123 Test St",
           monthly_rent: 1200,
           image: file
         },
         headers: auth

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body["cover_image_uri"]).to include("/public/unit/")
  end

  it "uploads hero-illustration_no.webp and sets cover_image_uri on update" do
    unit = create(:unit, org: org, name: "X", address: "Y")
    image_path = Rails.root.join("..", "..", "frontend", "assets", "images", "hero-illustration_no.webp").expand_path
    file = Rack::Test::UploadedFile.new(image_path, "image/webp", original_filename: "hero-illustration_no.webp")

    # No stubs: hit real Supabase

    put "/api/v1/units/#{unit.id}",
        params: { image: file },
        headers: auth

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["cover_image_uri"]).to include("/public/unit/")
  end
end


