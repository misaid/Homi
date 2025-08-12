class CreateDeviceTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :device_tokens, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :org_id, null: false
      t.uuid :user_id, null: false
      t.text :token, null: false
      t.text :platform, null: false
      t.datetime :last_seen_at
      t.timestamps
    end

    add_index :device_tokens, [:org_id, :user_id]
    add_index :device_tokens, :token, unique: true
    add_foreign_key :device_tokens, :orgs
    add_foreign_key :device_tokens, :users

    reversible do |dir|
      dir.up do
        execute <<~SQL
          ALTER TABLE device_tokens
          ADD CONSTRAINT device_tokens_platform_check
          CHECK (platform IN ('ios','android'))
        SQL
      end
      dir.down do
        execute <<~SQL
          ALTER TABLE device_tokens
          DROP CONSTRAINT IF EXISTS device_tokens_platform_check
        SQL
      end
    end
  end
end


