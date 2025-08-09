require 'rails_helper'

RSpec.describe 'Upload', type: :request do
  let(:org) { create(:org) }

  before do
    allow(AuthTokenVerifier).to receive(:verify).and_return({ 'sub' => 'u1', 'sid' => 's1', 'org_id' => org.id })
  end

  def auth
    { 'Authorization' => 'Bearer x' }
  end

  it 'uploads a file via Supabase storage wrapper' do
    file = Rack::Test::UploadedFile.new(StringIO.new('hello'), 'text/plain', original_filename: 'hello.txt')
    expect(SupabaseStorage).to receive(:upload).and_return({ path: 'org/unit/123.txt' })
    expect(SupabaseStorage).to receive(:signed_url).and_return('https://example.com/123')
    post '/v1/upload', params: { file: file, scope: 'unit' }, headers: auth
    expect(response).to have_http_status(:ok)
    expect(json_body['url']).to eq('https://example.com/123')
  end

  it 'returns 500 when storage fails' do
    file = Rack::Test::UploadedFile.new(StringIO.new('oops'), 'text/plain', original_filename: 'oops.txt')
    expect(SupabaseStorage).to receive(:upload).and_raise('boom')
    post '/v1/upload', params: { file: file }, headers: auth
    expect(response).to have_http_status(:internal_server_error)
    expect(json_body['error']).to be_present
  end
end


