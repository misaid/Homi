require 'rails_helper'

RSpec.describe 'Notifications API', type: :request do
  let(:org) { create(:org) }
  let(:headers) { auth_header(org_id: org.id) }

  it 'lists notifications with pagination and unread filter' do
    3.times do |i|
      Notification.create!(org_id: org.id, user_id: 'dev-user', title: "T#{i}", body: 'B')
    end
    get '/api/v1/notifications', params: { page: 1, limit: 2 }, headers: headers
    expect(response).to have_http_status(:ok)
    body = json_body
    expect(body['items'].length).to eq(2)
    expect(body['total']).to eq(3)

    # mark one read
    n = Notification.where(org_id: org.id, user_id: 'dev-user').first
    n.update!(read_at: Time.current)
    get '/api/v1/notifications', params: { only_unread: true, page: 1, limit: 10 }, headers: headers
    expect(json_body['total']).to eq(2)
  end

  it 'marks a notification read' do
    n = Notification.create!(org_id: org.id, user_id: 'dev-user', title: 'Hello', body: 'World')
    patch "/api/v1/notifications/#{n.id}/read", headers: headers
    expect(response).to have_http_status(:ok)
    expect(n.reload.read_at).not_to be_nil
  end

  it 'marks all read' do
    2.times { Notification.create!(org_id: org.id, user_id: 'dev-user', title: 't', body: 'b') }
    patch "/api/v1/notifications/read_all", headers: headers
    expect(response).to have_http_status(:ok)
    expect(Notification.where(org_id: org.id, user_id: 'dev-user', read_at: nil).count).to eq(0)
  end

  it 'creates and enqueues push job' do
    ActiveJob::Base.queue_adapter = :test
    post '/api/v1/notifications', params: { title: 'Hi', body: 'There' }, headers: headers
    expect(response).to have_http_status(:created)
    expect(Notification.where(org_id: org.id, user_id: 'dev-user').count).to eq(1)
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.any? { |j| j[:job] == PushNotifications::SendJob }).to eq(true)
  ensure
    ActiveJob::Base.queue_adapter = :sidekiq
  end
end


