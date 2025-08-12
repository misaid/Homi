class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :org_id, null: false
      t.uuid :user_id, null: false
      t.text :title, null: false
      t.text :body, null: false
      t.text :kind, default: 'general'
      t.jsonb :data, default: {}
      t.datetime :read_at
      t.timestamps
    end

    add_index :notifications, [:org_id, :user_id, :created_at], order: { created_at: :desc }, name: 'index_notifications_on_org_user_created_at'
    add_index :notifications, [:user_id, :read_at]
    add_foreign_key :notifications, :orgs
    add_foreign_key :notifications, :users
  end
end


