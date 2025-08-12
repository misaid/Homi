namespace :demo do
  desc "Send a demo notification to a user id"
  task :notify, [:user_id, :org_id] => :environment do |t, args|
    user_id = args[:user_id]
    org_id = args[:org_id]
    abort("user_id required: rake demo:notify[user_id,org_id]") if user_id.blank?
    abort("org_id required: rake demo:notify[user_id,org_id]") if org_id.blank?

    n = Notification.create!(
      org_id: org_id,
      user_id: user_id,
      title: "Hello from Homi",
      body: "This is a test notification",
      kind: "general",
      data: { demo: true }
    )
    PushNotifications::SendJob.perform_later(org_id: org_id, user_id: user_id, title: n.title, body: n.body, data: n.data)
    puts "Enqueued notification #{n.id}"
  end
end


